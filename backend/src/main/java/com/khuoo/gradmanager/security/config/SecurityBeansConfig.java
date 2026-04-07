package com.khuoo.gradmanager.security.config;

import com.khuoo.gradmanager.security.oauth2.AuthCookieProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// 보안 공통 빈 설정
@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(AuthCookieProperties.class)
public class SecurityBeansConfig {

    private final AuthCookieProperties authCookieProperties;

    // 쿠키 인증 전용 CORS 정책
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration apiCors = new CorsConfiguration();
        apiCors.setAllowCredentials(true);
        apiCors.setAllowedOrigins(authCookieProperties.getAllowedOrigins());
        apiCors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        apiCors.setAllowedHeaders(List.of("Content-Type", "X-Requested-With"));
        apiCors.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/v1/**", apiCors);
        return source;
    }
}
