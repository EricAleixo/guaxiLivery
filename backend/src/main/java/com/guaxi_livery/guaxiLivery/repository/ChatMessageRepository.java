package com.guaxi_livery.guaxiLivery.repository;

import com.guaxi_livery.guaxiLivery.domain.ChatChannel;
import com.guaxi_livery.guaxiLivery.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

	@Query("select m from ChatMessage m join fetch m.sender join fetch m.delivery where m.delivery.id in :deliveryIds and m.channel = :channel order by m.createdAt")
	List<ChatMessage> thread(Collection<UUID> deliveryIds, ChatChannel channel);

	@Query("select m from ChatMessage m join fetch m.sender join fetch m.delivery where m.delivery.id in :deliveryIds order by m.createdAt")
	List<ChatMessage> forDeliveries(Collection<UUID> deliveryIds);

	@Modifying
	@Query("update ChatMessage m set m.readAt = :now where m.delivery.id in :deliveryIds and m.channel = :channel and m.sender.id <> :readerId and m.readAt is null")
	int markRead(Collection<UUID> deliveryIds, ChatChannel channel, UUID readerId, Instant now);
}
