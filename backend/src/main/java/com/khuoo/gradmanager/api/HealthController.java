package com.khuoo.gradmanager.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Profile("local")
@RestController
@RequestMapping("/test")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 기본 서버 확인
    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    // DB 연결 확인
    @GetMapping("/health/db")
    public String db() {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return "DB_OK:" + one;
    }

    // JSON 반환 테스트
    @GetMapping("/sample")
    public Map<String, Object> sample() {
        return Map.of(
                "message", "Hello GradManager",
                "status", "SUCCESS"
        );
    }

    // JDBC Insert + Select 테스트
    @GetMapping("/db/test")
    public List<Map<String, Object>> dbTest() {

        jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS test_table (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100)
                    )
                """);

        jdbcTemplate.update("INSERT INTO test_table(name) VALUES (?)", "sample");

        return jdbcTemplate.queryForList("SELECT * FROM test_table");
    }
}
