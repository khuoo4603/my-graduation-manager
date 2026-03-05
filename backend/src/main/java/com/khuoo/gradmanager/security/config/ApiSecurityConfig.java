package com.khuoo.gradmanager.security.config;

import com.khuoo.gradmanager.security.jwt.JwtAuthenticationFilter;
import com.khuoo.gradmanager.security.jwt.JwtTokenProvider;
import com.khuoo.gradmanager.security.oauth2.AuthCookieProperties;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

// /api/v1/** 보안 체인
@Configuration
@RequiredArgsConstructor
public class ApiSecurityConfig {

    private static final String API_CSP =
            "default-src 'none'; " +
            "base-uri 'self'; " +
            "frame-ancestors 'none'; " +
            "form-action 'self'; " +
            "object-src 'none'; " +
            "img-src 'self' data:; " +
            "style-src 'self'; " +
            "script-src 'none'; " +
            "connect-src 'self'";

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieProperties authCookieProperties;

    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(
                jwtTokenProvider,
                authCookieProperties.getCookieName()
        );

        return http
                // 이 체인은 API 경로만 처리
                .securityMatcher("/api/v1/**")

                // CORS preflight를 Security 앞에서 처리
                .cors(Customizer.withDefaults())

                // API는 CSRF 토큰을 사용하지 않음
                .csrf(AbstractHttpConfigurer::disable)

                // API 응답용 보안 헤더
                .headers(headers -> {
                    headers.contentSecurityPolicy(csp -> csp.policyDirectives(API_CSP));
                    headers.contentTypeOptions(Customizer.withDefaults());
                    headers.referrerPolicy(referrer -> referrer
                            .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER));
                    headers.permissionsPolicy(permissions ->
                            permissions.policy("geolocation=(), microphone=(), camera=()"));
                    headers.frameOptions(Customizer.withDefaults());
                })

                // API는 세션 사용 X
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 폼 로그인 / Basic 인증 사용 X
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // API 표준 응답
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler((req, res, e) -> res.sendError(HttpServletResponse.SC_FORBIDDEN))
                )

                // API 인증 정책
                .authorizeHttpRequests(auth -> auth
                        // CORS preflight는 인증 없이 통과
                        .requestMatchers(HttpMethod.OPTIONS, "/api/v1/**").permitAll()
                        // 로그아웃은 쿠키 삭제 목적
                        .requestMatchers("/api/v1/auth/logout").permitAll()
                        // 그 외 API는 인증 필요
                        .anyRequest().authenticated()
                )

                // JWT 필터 등록
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }
}