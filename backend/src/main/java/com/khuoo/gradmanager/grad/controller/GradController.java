package com.khuoo.gradmanager.grad.controller;

import com.khuoo.gradmanager.grad.dto.GraduationStatusResponse;
import com.khuoo.gradmanager.grad.service.GradService;
import com.khuoo.gradmanager.security.principal.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/grad")
public class GradController {

    private final CurrentUser currentUser;
    private final GradService gradService;

    @GetMapping("/status")
    public GraduationStatusResponse status() {
        return gradService.getStatus(currentUser.userId());
    }
}