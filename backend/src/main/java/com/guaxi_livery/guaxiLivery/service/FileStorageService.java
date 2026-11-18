package com.guaxi_livery.guaxiLivery.service;

import com.guaxi_livery.guaxiLivery.web.ApiException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

	private static final Map<String, String> EXTENSIONS = Map.of(
			"image/jpeg", ".jpg",
			"image/png", ".png",
			"image/webp", ".webp");

	private static final Map<String, String> VIDEO_EXTENSIONS = Map.of(
			"video/mp4", ".mp4",
			"video/webm", ".webm",
			"video/quicktime", ".mov");

	private final Path root;

	public FileStorageService(@Value("${app.upload.dir}") String dir) {
		this.root = Path.of(dir).toAbsolutePath().normalize();
	}

	@PostConstruct
	void init() throws IOException {
		Files.createDirectories(root);
	}

	/** Salva a imagem com nome gerado (nunca usa o nome enviado pelo cliente). */
	public String storeImage(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "A foto da comida é obrigatória");
		}
		String ext = EXTENSIONS.get(file.getContentType());
		if (ext == null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Formato de imagem inválido (use JPG, PNG ou WEBP)");
		}
		String filename = UUID.randomUUID() + ext;
		try (InputStream in = file.getInputStream()) {
			Files.copy(in, root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
		} catch (IOException e) {
			throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao salvar a imagem");
		}
		return filename;
	}

	/** Salva foto (JPG/PNG/WEBP) ou vídeo (MP4/WEBM/MOV) e devolve o nome gerado. */
	public String storeMedia(MultipartFile file) {
		String ext = file == null ? null : VIDEO_EXTENSIONS.get(file.getContentType());
		if (ext == null) return storeImage(file);
		String filename = UUID.randomUUID() + ext;
		try (InputStream in = file.getInputStream()) {
			Files.copy(in, root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
		} catch (IOException e) {
			throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao salvar o vídeo");
		}
		return filename;
	}

	public static boolean isVideo(String filename) {
		return VIDEO_EXTENSIONS.containsValue(filename.substring(filename.lastIndexOf('.')));
	}

	public void delete(String filename) {
		try {
			Path file = root.resolve(filename).normalize();
			if (file.startsWith(root)) Files.deleteIfExists(file);
		} catch (IOException ignored) {
			// arquivo órfão não impede a operação
		}
	}

	public Resource load(String filename) {
		Path file = root.resolve(filename).normalize();
		if (!file.startsWith(root) || !Files.isRegularFile(file)) {
			throw new ApiException(HttpStatus.NOT_FOUND, "Imagem não encontrada");
		}
		try {
			return new UrlResource(file.toUri());
		} catch (MalformedURLException e) {
			throw new ApiException(HttpStatus.NOT_FOUND, "Imagem não encontrada");
		}
	}
}
