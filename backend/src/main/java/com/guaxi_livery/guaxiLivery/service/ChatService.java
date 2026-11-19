package com.guaxi_livery.guaxiLivery.service;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.ChatDtos.*;
import com.guaxi_livery.guaxiLivery.repository.*;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Chat entre cliente e empresa (canal EMPRESA) ou entre cliente e entregador (canal ENTREGADOR).
 * Cada par de pessoas tem UMA conversa, que reúne todos os pedidos entre elas; cada mensagem
 * guarda o pedido em que foi escrita. Com a empresa dá para falar sempre; com o entregador só
 * enquanto algum pedido entre os dois está em rota.
 */
@Service
public class ChatService {

	private final ChatMessageRepository messages;
	private final DeliveryRepository deliveries;
	private final CompanyRepository companies;
	private final CourierRepository couriers;
	private final UserRepository users;

	public ChatService(ChatMessageRepository messages, DeliveryRepository deliveries, CompanyRepository companies,
					   CourierRepository couriers, UserRepository users) {
		this.messages = messages;
		this.deliveries = deliveries;
		this.companies = companies;
		this.couriers = couriers;
		this.users = users;
	}

	/** Usuário do outro lado do canal em um pedido, ou null se ainda não existe. */
	private User counterpart(Delivery d, ChatChannel ch) {
		return ch == ChatChannel.EMPRESA
				? (d.getCompany() == null ? null : d.getCompany().getUser())
				: (d.getCourier() == null ? null : d.getCourier().getUser());
	}

	private boolean isOpen(Collection<Delivery> pair, ChatChannel ch) {
		return ch == ChatChannel.EMPRESA || pair.stream().anyMatch(d -> d.getStatus() == DeliveryStatus.EM_ROTA);
	}

	/** Pedidos entre o usuário e a outra pessoa neste canal; 403 se não há nenhum. */
	private List<Delivery> pair(User me, UUID otherId, ChatChannel ch) {
		List<Delivery> l = ch == ChatChannel.EMPRESA ? deliveries.pairCompany(me.getId(), otherId) : deliveries.pairCourier(me.getId(), otherId);
		if (l.isEmpty()) throw new ApiException(HttpStatus.FORBIDDEN, "Você não participa desta conversa");
		return l;
	}

	/** Empresa aparece com o nome fantasia e o logo (que ficam em Company); os demais, com nome e foto do usuário. */
	private Party party(User u, String role, boolean canSend) {
		String name = u.getName(), file = u.getAvatarFilename();
		if (u.getRole() == Role.EMPRESA) {
			Optional<Company> c = companies.findByUserId(u.getId());
			if (c.isPresent()) {
				name = c.get().getTradeName();
				if (c.get().getLogoFilename() != null && !c.get().getLogoFilename().isBlank()) file = c.get().getLogoFilename();
			}
		}
		return new Party(u.getId(), name, file == null || file.isBlank() ? null : "/api/uploads/" + file, role, canSend);
	}

	private String roleOf(Delivery latest, UUID otherId, ChatChannel ch) {
		return latest.getClient().getId().equals(otherId) ? "Cliente" : ch == ChatChannel.EMPRESA ? "Empresa" : "Entregador";
	}

	/** Abre a conversa a partir de um pedido (links "falar com..."): devolve quem está do outro lado. */
	@Transactional(readOnly = true)
	public Party other(User me, UUID deliveryId, ChatChannel ch) {
		Delivery d = deliveries.findById(deliveryId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
		User other = counterpart(d, ch);
		boolean iAmClient = d.getClient().getId().equals(me.getId());
		if (other == null || !(iAmClient || other.getId().equals(me.getId()))) throw new ApiException(HttpStatus.FORBIDDEN, "Você não participa desta conversa");
		User target = iAmClient ? other : d.getClient();
		return party(target, roleOf(d, target.getId(), ch), isOpen(pair(me, target.getId(), ch), ch));
	}

	@Transactional
	public MessageResponse send(User me, UUID otherId, ChatChannel ch, String content) {
		List<Delivery> pair = pair(me, otherId, ch);
		Delivery d = ch == ChatChannel.EMPRESA ? pair.get(0)
				: pair.stream().filter(x -> x.getStatus() == DeliveryStatus.EM_ROTA).findFirst().orElseThrow(() ->
				new ApiException(HttpStatus.CONFLICT, "O chat com o entregador só fica aberto enquanto ele está indo fazer a entrega"));
		String text = content == null ? "" : content.strip();
		if (text.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Escreva uma mensagem");
		if (text.length() > 1000) throw new ApiException(HttpStatus.BAD_REQUEST, "Mensagem muito longa (máx. 1000 caracteres)");
		ChatMessage m = new ChatMessage();
		m.setDelivery(d);
		m.setChannel(ch);
		m.setSender(me);
		m.setContent(text);
		return MessageResponse.of(messages.save(m), otherId);
	}

	private List<UUID> ids(Collection<Delivery> l) { return l.stream().map(Delivery::getId).toList(); }

	@Transactional
	public ChatThread thread(User me, UUID otherId, ChatChannel ch) {
		List<Delivery> pair = pair(me, otherId, ch);
		messages.markRead(ids(pair), ch, me.getId(), Instant.now());
		User other = users.findById(otherId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
		List<MessageResponse> list = messages.thread(ids(pair), ch).stream()
				.map(m -> MessageResponse.of(m, m.getSender().getId().equals(me.getId()) ? otherId : me.getId())).toList();
		return new ChatThread(party(other, roleOf(pair.get(0), otherId, ch), isOpen(pair, ch)), list);
	}

	@Transactional
	public void markRead(User me, UUID otherId, ChatChannel ch) {
		messages.markRead(ids(pair(me, otherId, ch)), ch, me.getId(), Instant.now());
	}

	private record Group(User other, ChatChannel channel, List<Delivery> orders) {}

	/** Aba de chats: uma conversa por pessoa/empresa, da mais recente para a mais antiga. */
	@Transactional(readOnly = true)
	public List<ConversationResponse> inbox(User me) {
		List<Delivery> mine = new ArrayList<>();
		if (me.getRole() == Role.EMPRESA) {
			companies.findByUserId(me.getId()).ifPresent(c -> mine.addAll(deliveries.findTop50ByCompanyIdOrderByCreatedAtDesc(c.getId())));
		} else {
			if (me.getRole() == Role.ENTREGADOR) couriers.findByUserId(me.getId()).ifPresent(c -> mine.addAll(deliveries.findTop50ByCourierIdOrderByCreatedAtDesc(c.getId())));
			mine.addAll(deliveries.findTop50ByClientIdOrderByCreatedAtDesc(me.getId())); // entregador também é cliente
		}
		if (mine.isEmpty()) return List.of();
		mine.sort(Comparator.comparing(Delivery::getCreatedAt).reversed());

		Map<String, Group> groups = new LinkedHashMap<>();
		for (Delivery d : mine) {
			boolean iAmClient = d.getClient().getId().equals(me.getId());
			for (ChatChannel ch : ChatChannel.values()) {
				User other = counterpart(d, ch);
				if (other == null) continue;
				User target = iAmClient ? other : other.getId().equals(me.getId()) ? d.getClient() : null;
				if (target == null || target.getId().equals(me.getId())) continue;
				groups.computeIfAbsent(ch + ":" + target.getId(), k -> new Group(target, ch, new ArrayList<>())).orders().add(d);
			}
		}
		Map<UUID, List<ChatMessage>> byDelivery = messages.forDeliveries(mine.stream().map(Delivery::getId).toList()).stream()
				.collect(Collectors.groupingBy(m -> m.getDelivery().getId()));

		List<ConversationResponse> out = new ArrayList<>();
		for (Group g : groups.values()) {
			List<ChatMessage> msgs = g.orders().stream().flatMap(d -> byDelivery.getOrDefault(d.getId(), List.of()).stream())
					.filter(m -> m.getChannel() == g.channel()).sorted(Comparator.comparing(ChatMessage::getCreatedAt)).toList();
			boolean open = isOpen(g.orders(), g.channel());
			if (msgs.isEmpty() && !open) continue; // entregador: só aparece quando está em rota (ou se já conversaram)
			Delivery latest = g.orders().get(0);
			ChatMessage last = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);
			long unread = msgs.stream().filter(m -> m.getReadAt() == null && !m.getSender().getId().equals(me.getId())).count();
			out.add(new ConversationResponse(g.other().getId(), g.channel(), latest.getFoodName(), latest.getQuantity(), latest.getStatus(),
					g.orders().size(), party(g.other(), roleOf(latest, g.other().getId(), g.channel()), open),
					last == null ? null : MessageResponse.of(last, last.getSender().getId().equals(me.getId()) ? g.other().getId() : me.getId()),
					unread, last == null ? latest.getCreatedAt() : last.getCreatedAt()));
		}
		out.sort(Comparator.comparing(ConversationResponse::updatedAt).reversed());
		return out;
	}
}
