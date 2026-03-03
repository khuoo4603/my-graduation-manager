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

    // access_token 쿠키 이름은 설정(app.auth.cookie-name)으로 고정한다.
    // 필터에서 하드코딩하면 도메인 변경/정책 변경 시 리스크가 커진다.
    private final String accessTokenCookieName;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // 이미 인증이 세팅되어 있으면 중복 처리하지 않는다.
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Cookie 기반 인증 단일화:
        // - Authorization Bearer는 읽지 않는다.
        // - 브라우저/Swagger 실행 시 쿠키 자동 전송이 표준 흐름이 된다.
        String token = resolveAccessTokenFromCookie(request);

        // 토큰이 없으면 여기서 실패 처리를 하지 않는다.
        // "인증 필요 경로"에서 Spring Security가 401 처리를 하도록 위임해야 정책이 깔끔해진다.
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 위조/만료/형식 오류면 인증을 세팅하지 않는다.
            // (401/403 응답은 SecurityConfig의 entrypoint/denied handler가 담당)
            if (!jwtTokenProvider.validate(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            // 토큰에서 최소 식별자만 꺼낸다.
            // userId/email은 CurrentUser와 서비스 로직에서 핵심 키로 쓰인다.
            Long userId = jwtTokenProvider.getUserId(token);
            String email = jwtTokenProvider.getEmail(token);

            // Principal은 "현재 사용자 식별" 목적이다.
            // 권한(Role)은 MVP에서 사용하지 않으므로 빈 권한 리스트를 유지한다.
            AuthPrincipal principal = new AuthPrincipal(userId, email);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            Collections.emptyList()
                    );

            // 감사/추적 목적의 request metadata(ip, sessionId 등)를 Authentication에 부여한다.
            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            // 인증 성공 시점에만 SecurityContext에 저장한다.
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            // 토큰 파싱/클레임 변환 등 예상치 못한 예외는 로그로만 남기고,
            // 요청 자체는 다음 필터로 넘긴다(보안상 인증 실패로 간주).
            log.error("JWT 인증 실패", e);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveAccessTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();

        // 쿠키가 없으면 인증 시도 자체를 하지 않는다.
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            // access_token만 사용한다(정책 단일화).
            if (accessTokenCookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}