package com.khuoo.gradmanager.security.config;

import com.khuoo.gradmanager.security.jwt.JwtAuthenticationFilter;
import com.khuoo.gradmanager.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtTokenProvider);

        return http
                // CSRF 불필요 -> 메모리 저장 예정
                .csrf(csrf -> csrf.disable())

                // 세션 미사용 (일단 개발중.. 추후 정책 변경)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 기본 로그인 방식 비활성화
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                // 접근 제어
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/health/**",
                                "/test/**",
                                "/api/v1/dev/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .requestMatchers("/api/v1/**").authenticated()
                        .anyRequest().denyAll()
                )

                // JWT 필터 등록
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }
}
