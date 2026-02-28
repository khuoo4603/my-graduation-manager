package com.khuoo.gradmanager.health.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;


    // liveness
    @GetMapping
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    // readiness
    @GetMapping("/ready")
    public ResponseEntity<String> ready() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok("READY");
        } catch (Exception e) {
            return ResponseEntity.status(503).body("NOT_READY");
        }
    }

    // 수동 점검
    @GetMapping("/db")
    public ResponseEntity<String> db() {
        try {
            Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok("DB_OK:" + one);
        } catch (Exception e) {
            return ResponseEntity.status(503).body("DB_NOT_OK");
        }
    }
}