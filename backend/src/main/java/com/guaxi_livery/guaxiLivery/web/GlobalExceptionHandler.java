package com.guaxi_livery.guaxiLivery.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ApiException.class)
	ResponseEntity<Map<String, Object>> api(ApiException e) {
		return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage()));
	}

	/** Cobre @Valid em JSON (MethodArgumentNotValidException) e em multipart (@ModelAttribute). */
	@ExceptionHandler(BindException.class)
	ResponseEntity<Map<String, Object>> validation(BindException e) {
		Map<String, String> fields = new LinkedHashMap<>();
		e.getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
		return ResponseEntity.badRequest().body(Map.of("message", "Dados inválidos", "fields", fields));
	}

	@ExceptionHandler(BadCredentialsException.class)
	ResponseEntity<Map<String, Object>> badCredentials(BadCredentialsException e) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	ResponseEntity<Map<String, Object>> tooLarge() {
		return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of("message", "Imagem maior que 5MB"));
	}

	/** Id na URL que nao e um UUID valido (ex.: /deliveries/123/status). */
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	ResponseEntity<Map<String, Object>> badArgument(MethodArgumentTypeMismatchException e) {
		return ResponseEntity.badRequest().body(Map.of("message", "Identificador inválido: " + e.getName()));
	}
}
