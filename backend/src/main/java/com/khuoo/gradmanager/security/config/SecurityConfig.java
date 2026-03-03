package com.khuoo.gradmanager.security.config;

import com.khuoo.gradmanager.security.jwt.JwtAuthenticationFilter;
import com.khuoo.gradmanager.security.jwt.JwtTokenProvider;
import com.khuoo.gradmanager.security.oauth2.AuthCookieProperties;
import com.khuoo.gradmanager.security.oauth2.OAuth2FailureHandler;
import com.khuoo.gradmanager.security.oauth2.OAuth2SuccessHandler;
import com.khuoo.gradmanager.security.oauth2.OAuth2UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(AuthCookieProperties.class)
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieProperties authCookieProperties;
    private final OAuth2UserServiceImpl oAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // JWT 인증은 "Cookie(access_token) 단일 경로"로 고정
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(
                jwtTokenProvider,
                authCookieProperties.getCookieName()
        );

        return http
                // CSRF 보안 비활성화 (개발중)
                .csrf(AbstractHttpConfigurer::disable)

                // 세션사용 X
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 기본 폼 로그인 X
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                res.sendError(HttpStatus.UNAUTHORIZED.value())) // 인증 없음/만료/위조 등 401
                        .accessDeniedHandler((req, res, e) ->
                                res.sendError(HttpStatus.FORBIDDEN.value())) // 인증은 되었으나 권한 부족 403
                )

                // OAuth2 로그인 활성화:
                // - userService: email 추출/검증 안정화
                // - successHandler: upsert + JWT 발급 + Set-Cookie + redirect
                // - failureHandler: 실패 시 redirect
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(oAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/health/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/oauth2/**",
                                "/api/v1/auth/logout"
                        ).permitAll()
                        .requestMatchers("/api/v1/**").authenticated()
                        .anyRequest().denyAll()
                )

                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                .build();
    }
}