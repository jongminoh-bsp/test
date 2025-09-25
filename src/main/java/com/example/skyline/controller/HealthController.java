package com.example.skyline.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {
    
    @Autowired
    private DataSource dataSource;
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("application", "Skyline");
        health.put("version", "1.0.0");
        
        // 데이터베이스 연결 확인
        try (Connection connection = dataSource.getConnection()) {
            health.put("database", Map.of(
                "status", "UP",
                "type", "MySQL",
                "url", connection.getMetaData().getURL()
            ));
        } catch (SQLException e) {
            health.put("database", Map.of(
                "status", "DOWN",
                "error", e.getMessage()
            ));
            return ResponseEntity.status(503).body(health);
        }
        
        return ResponseEntity.ok(health);
    }
    
    @GetMapping("/ready")
    public ResponseEntity<Map<String, String>> ready() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "READY");
        status.put("message", "Application is ready to serve requests");
        return ResponseEntity.ok(status);
    }
}