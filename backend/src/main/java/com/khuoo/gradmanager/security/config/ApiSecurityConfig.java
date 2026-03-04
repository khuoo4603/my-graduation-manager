package com.khuoo.gradmanager.security.config;

import com.khuoo.gradmanager.security.jwt.JwtAuthenticationFilter;
import com.khuoo.gradmanager.security.jwt.JwtTokenProvider;
import com.khuoo.gradmanager.security.oauth2.AuthCookieProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@RequiredArgsConstructor
public class ApiSecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieProperties authCookieProperties;

    // API 보안 설정 (/api/v1/**)
    @Bean
    @Order(1) // OAuth 체인 먼저 매칭
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(
                jwtTokenProvider,
                authCookieProperties.getCookieName()
        );

        return http
                // 이 체인은 API 경로만 처리
                .securityMatcher("/api/v1/**")

                // CSRF 토큰을 사용하지 않으므로 비활성화
                .csrf(AbstractHttpConfigurer::disable)

                // API는 세션 사용 X
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 폼 로그인 사용 X
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // API 표준 응답: 인증 실패 401, 권한 없음 403
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> res.sendError(401))
                        .accessDeniedHandler((req, res, e) -> res.sendError(403))
                )

                // API 인증 정책
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/logout").permitAll() // 로그아웃은 쿠키 삭제 목적으로 401, 403을 던지지 않음
                        .anyRequest().authenticated() // 그 외 API는 인증 필요
                )

                // JWT인증 후 SecurityContext를 사용할 수 있도록 실행 시점을 강제
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }
}