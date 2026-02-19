package com.khuoo.gradmanager.health.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 기본 서버 확인
    @GetMapping
    public String health() { return "OK"; }

    // DB 연결 확인
    @GetMapping("/db")
    public String db() {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return "DB_OK:" + one;
    }
}
