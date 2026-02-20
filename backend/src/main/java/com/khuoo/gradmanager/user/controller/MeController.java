package com.khuoo.gradmanager.user.controller;

import com.khuoo.gradmanager.security.principal.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
