package com.guaxi_livery.guaxiLivery.config;

import com.guaxi_livery.guaxiLivery.domain.User;
import com.guaxi_livery.guaxiLivery.repository.UserRepository;
import com.guaxi_livery.guaxiLivery.security.JwtService;
import com.guaxi_livery.guaxiLivery.web.ChatSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.Optional;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

	private final ChatSocketHandler handler;
	private final JwtService jwt;
	private final UserRepository users;
	private final String[] origins;

	public WebSocketConfig(ChatSocketHandler handler, JwtService jwt, UserRepository users,
						   @Value("${app.cors.allowed-origins}") String[] origins) {
		this.handler = handler;
		this.jwt = jwt;
		this.users = users;
		this.origins = origins;
	}

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(handler, "/ws/chat").addInterceptors(new HandshakeInterceptor() {
			/** Navegadores não enviam cabeçalhos no WebSocket: o JWT vem em ?token=. */
			@Override
			public boolean beforeHandshake(ServerHttpRequest req, ServerHttpResponse res, WebSocketHandler h, Map<String, Object> attrs) {
				String token = UriComponentsBuilder.fromUri(req.getURI()).build().getQueryParams().getFirst("token");
				Optional<User> user = token == null ? Optional.empty() : jwt.validate(token).flatMap(users::findByEmailIgnoreCase);
				user.ifPresent(u -> attrs.put(ChatSocketHandler.USER_ATTR, u));
				return user.isPresent();
			}

			@Override
			public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res, WebSocketHandler h, Exception ex) {}
		}).setAllowedOrigins(origins);
	}
}
