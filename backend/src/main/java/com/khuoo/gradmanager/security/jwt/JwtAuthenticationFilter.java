package com.khuoo.gradmanager.security.jwt;

import com.khuoo.gradmanager.security.principal.AuthPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final String accessTokenCookieName;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // 이미 인증이 세팅되어 있으면 중복 처리하지 않음.
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        // access_token값만 가져와 사용
        String token = resolveAccessTokenFromCookie(request);

        // 토큰이 없으면 Spring Security가 401 처리를 하도록 위임
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 위조/만료/형식 오류면 Spring Security가 401, 403 처리
            if (!jwtTokenProvider.validate(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            Long userId = jwtTokenProvider.getUserId(token);
            String email = jwtTokenProvider.getEmail(token);

            // Principal은 현재 사용자 식별 객체
            AuthPrincipal principal = new AuthPrincipal(userId, email);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            Collections.emptyList()
                    );

            // 추적 목적의 request metadata(ip, sessionId)
            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            // 인증 성공 시점에만 SecurityContext에 저장한다.
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            // 토큰 파싱/클레임 변환 등 예상치 못한 예외는 로그로 남기고 다음 로직 수행
            log.error("JWT 인증 실패", e);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveAccessTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();

        // 쿠키가 없으면 인증 시도 X
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            // access_token만 사용
            if (accessTokenCookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}