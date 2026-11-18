package com.guaxi_livery.guaxiLivery.web;

import com.guaxi_livery.guaxiLivery.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

	private final FileStorageService storage;

	public UploadController(FileStorageService storage) {
		this.storage = storage;
	}

	@GetMapping("/{filename:.+}")
	public ResponseEntity<Resource> get(@PathVariable String filename) {
		MediaType type = filename.endsWith(".png") ? MediaType.IMAGE_PNG
				: filename.endsWith(".webp") ? MediaType.parseMediaType("image/webp")
				: filename.endsWith(".mp4") ? MediaType.parseMediaType("video/mp4")
				: filename.endsWith(".webm") ? MediaType.parseMediaType("video/webm")
				: filename.endsWith(".mov") ? MediaType.parseMediaType("video/quicktime") : MediaType.IMAGE_JPEG;
		return ResponseEntity.ok()
				.contentType(type)
				.cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
				.header("X-Content-Type-Options", "nosniff")
				.body(storage.load(filename));
	}
}
