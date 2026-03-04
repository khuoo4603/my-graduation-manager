package com.khuoo.gradmanager.user.controller;

import com.khuoo.gradmanager.security.principal.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1")
public class MeController {

    private final CurrentUser currentUser;

    @GetMapping("/me")
    public MeResponse me() {
        return new MeResponse(
                currentUser.userId(),
                currentUser.email()
        );
    }

    public record MeResponse(
            long userId,
            String email
    ) {}

    @GetMapping("/debug/forwarded")
    public Map<String, String> debug(HttpServletRequest req) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("scheme", req.getScheme());
        m.put("serverName", req.getServerName());
        m.put("xfp", req.getHeader("X-Forwarded-Proto"));
        m.put("xfh", req.getHeader("X-Forwarded-Host"));
        m.put("xport", req.getHeader("X-Forwarded-Port"));
        m.put("forwarded", req.getHeader("Forwarded"));
        return m;
    }
}
