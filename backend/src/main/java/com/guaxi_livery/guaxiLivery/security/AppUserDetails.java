package com.guaxi_livery.guaxiLivery.security;

import com.guaxi_livery.guaxiLivery.domain.Role;
import com.guaxi_livery.guaxiLivery.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public record AppUserDetails(User user) implements UserDetails {

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		// Entregador também é cliente: pede, avalia e usa a sacola como qualquer cliente.
		if (user.getRole() == Role.ENTREGADOR) {
			return List.of(new SimpleGrantedAuthority("ROLE_ENTREGADOR"), new SimpleGrantedAuthority("ROLE_CLIENTE"));
		}
		return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
	}

	@Override
	public String getPassword() {
		return user.getPassword();
	}

	@Override
	public String getUsername() {
		return user.getEmail();
	}
}
