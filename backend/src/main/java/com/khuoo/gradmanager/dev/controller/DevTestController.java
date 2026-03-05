package com.khuoo.gradmanager.dev.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@Profile({"local", "dev"})
@RestController
@RequestMapping("/dev")
public class DevTestController {

    // local환경 테스트
    @GetMapping
    public String test() { return "Test OK"; }

    // JSON 반환 테스트
    @GetMapping("/sample")
    public Map<String, Object> sample() {
        return Map.of(
                "message", "Hello GradManager",
                "status", "SUCCESS"
        );
    }

    // 사용자 헤더 확인
    @GetMapping("/debug/headers")
    public Map<String, String> headers(HttpServletRequest request) {
        Map<String, String> map = new HashMap<>();
        Enumeration<String> names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            map.put(name, request.getHeader(name));
        }
        return map;
    }

    // Forwarded 정보
    @GetMapping("/debug/request")
    public Map<String, Object> request(HttpServletRequest request) {
        Map<String, Object> map = new HashMap<>();

        map.put("scheme", request.getScheme());
        map.put("serverName", request.getServerName());
        map.put("serverPort", request.getServerPort());
        map.put("requestURL", request.getRequestURL().toString());
        map.put("remoteAddr", request.getRemoteAddr());

        return map;
    }

    // JWT / 인증 상태 확인
    @GetMapping("/debug/auth")
    public Map<String, Object> auth(Authentication authentication) {
        if (authentication == null) {
            return Map.of("authenticated", false);
        }

        return Map.of(
                "authenticated", true,
                "principal", authentication.getName(),
                "authorities", authentication.getAuthorities()
        );
    }

    // Cookie 확인
    @GetMapping("/debug/cookies")
    public Map<String, String> cookies(HttpServletRequest request) {

        Map<String, String> map = new HashMap<>();

        if (request.getCookies() == null) {
            return Map.of("cookies", "none");
        }

        for (var cookie : request.getCookies()) {
            map.put(cookie.getName(), cookie.getValue());
        }

        return map;
    }
}
