package com.khuoo.gradmanager.security.config;

import com.khuoo.gradmanager.security.oauth2.OAuth2FailureHandler;
import com.khuoo.gradmanager.security.oauth2.OAuth2SuccessHandler;
import com.khuoo.gradmanager.security.oauth2.OAuth2UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
@RequiredArgsConstructor
public class PublicWebSecurityConfig {

    private final OAuth2UserServiceImpl oAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;

    @Bean
    @Order(2)
    public SecurityFilterChain publicWebSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
                // OAuth2 시작(/oauth2/authorization/*) 및 콜백(/login/oauth2/code/*) 처리
                // 그 외 인증이 필요없는 api 처리
                .securityMatcher(
                        "/oauth2/**",
                        "/login/**",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/health/**"
                )

                // CSRF 토큰을 사용하지 않으므로 비활성화
                .csrf(AbstractHttpConfigurer::disable)

                // OAuth2 state 저장을 위해 세션 허용
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                // 폼 로그인 사용 X
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // OAuth2 로그인 구성
                .oauth2Login(oauth2 -> oauth2
                        // Google 사용자 정보 조회 후, principal로 매핑
                        .userInfoEndpoint(userInfo -> userInfo.userService(oAuth2UserService))
                        // 성공 시: 사용자 upsert -> JWT 발급 -> HttpOnly 쿠키 세팅 -> redirect
                        .successHandler(oAuth2SuccessHandler)
                        // 실패 시: oauth2=fail, redirect
                        .failureHandler(oAuth2FailureHandler)
                )

                // 이 체인의 경로는 모두 인증없이 실행
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())

                .build();
    }
}