package com.ncwu.stylehub.service;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ncwu.stylehub.config.Env;

/**
 * Signed Cloudinary upload (REST, no SDK). Returns the secure CDN URL,
 * or null when Cloudinary is not configured / the upload fails (callers
 * then fall back to the local uploads/ folder).
 */
public final class CloudinaryUploader {

    private CloudinaryUploader() {
    }

    public static String upload(byte[] data, String filename) {
        String cloud = Env.get("CLOUDINARY_CLOUD_NAME");
        String apiKey = Env.get("CLOUDINARY_API_KEY");
        String apiSecret = Env.get("CLOUDINARY_API_SECRET");
        String folder = Env.get("CLOUDINARY_FOLDER", "ncwu-stylehub");
        if (isBlank(cloud) || isBlank(apiKey) || isBlank(apiSecret)) {
            return null;
        }
        try {
            long timestamp = System.currentTimeMillis() / 1000L;
            String paramsToSign = "folder=" + folder + "&timestamp=" + timestamp;
            String signature = sha1Hex(paramsToSign + apiSecret);
            String boundary = UUID.randomUUID().toString().replace("-", "");

            ByteArrayOutputStream body = new ByteArrayOutputStream();
            field(body, boundary, "api_key", apiKey);
            field(body, boundary, "timestamp", String.valueOf(timestamp));
            field(body, boundary, "folder", folder);
            field(body, boundary, "signature", signature);
            fileField(body, boundary, filename != null ? filename : "image.png", data);
            body.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloud + "/image/upload"))
                    .timeout(Duration.ofSeconds(45))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                    .build();
            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                return null;
            }
            JsonNode json = new ObjectMapper().readTree(response.body());
            String url = json.path("secure_url").asText(null);
            return isBlank(url) ? null : url;
        } catch (Exception e) {
            return null;
        }
    }

    private static void field(ByteArrayOutputStream body, String boundary, String name, String value)
            throws Exception {
        body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"" + name + "\"\r\n\r\n"
                + value + "\r\n").getBytes(StandardCharsets.UTF_8));
    }

    private static void fileField(ByteArrayOutputStream body, String boundary, String filename, byte[] data)
            throws Exception {
        body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\""
                + filename + "\"\r\nContent-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(data);
        body.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private static String sha1Hex(String input) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-1").digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(digest);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
