package com.khuoo.gradmanager.config.startup;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.util.Arrays;

@Slf4j
@Component
public class StartupLoggerRunner implements ApplicationRunner {

    private final Environment env;
    private final JdbcTemplate jdbcTemplate;

    public StartupLoggerRunner(Environment env, JdbcTemplate jdbcTemplate) {
        this.env = env;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        String[] profiles = env.getActiveProfiles();
        String devTokenEnabled = env.getProperty("app.dev-token.enabled", "false");
        String storageRoot = env.getProperty("app.storage.root", "(설정되지 않음)");
        String serverPort = env.getProperty("server.port", "8080");

        log.info("==================================================");
        log.info("[Application Started]");
        log.info("실행 프로필: {}", Arrays.toString(profiles));
        log.info("서버 포트: {}", serverPort);
        log.info("Dev 토큰 활성화 여부: {}", devTokenEnabled);
        log.info("파일 저장 루트 경로: {}", storageRoot);

        // JVM 정보
        log.info("Java 버전: {}", System.getProperty("java.version"));
        log.info("운영체제: {} {}",
                System.getProperty("os.name"),
                System.getProperty("os.version"));

        // DB 연결 테스트
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            log.info("DB 연결 상태: 정상");
        } catch (Exception e) {
            log.error("DB 연결 상태: 실패", e);
        }

        log.info("==================================================");
    }
}
