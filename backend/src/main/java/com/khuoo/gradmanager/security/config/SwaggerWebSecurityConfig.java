package com.khuoo.gradmanager.security.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;


@Configuration
@RequiredArgsConstructor
public class SwaggerWebSecurityConfig {

    private static final String SWAGGER_CSP =
            "default-src 'none'; " +
            "base-uri 'self'; " +
            "frame-ancestors 'none'; " +
            "form-action 'self'; " +
            "object-src 'none'; " +
            "img-src 'self' data:; " +
            "style-src 'self' 'unsafe-inline'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "connect-src 'self'";

    @Bean
    @Order(2)
    public SecurityFilterChain swaggerSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Swagger 경로만 매칭
                .securityMatcher(
                        "/swagger-ui/**",
                        "/v3/api-docs/**"
                )

                // CSRF 토큰 사용 X
                .csrf(AbstractHttpConfigurer::disable)

                // 세션 사용 X
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 폼 로그인 사용 X
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // Swagger 전용 완화 CSP + 기본 보안 헤더 적용
                .headers(headers -> {
                    headers.contentSecurityPolicy(csp -> csp.policyDirectives(SWAGGER_CSP));
                    headers.contentTypeOptions(Customizer.withDefaults());
                    headers.referrerPolicy(referrer -> referrer
                            .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER));
                    headers.permissionsPolicy(permissions ->
                            permissions.policy("geolocation=(), microphone=(), camera=()"));
                    headers.frameOptions(Customizer.withDefaults());
                })

                // Swagger는 공개 경로로 노출
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())

                .build();
    }
}