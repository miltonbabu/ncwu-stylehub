package com.ncwu.stylehub.web;

import java.util.Map;
import javax.sql.DataSource;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class HealthController {
    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        try (var connection = dataSource.getConnection()) {
            if (connection.isValid(3)) {
                return Map.of("status", "ok");
            }
        } catch (Exception ignored) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Database unavailable");
        }
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Database unavailable");
    }
}
