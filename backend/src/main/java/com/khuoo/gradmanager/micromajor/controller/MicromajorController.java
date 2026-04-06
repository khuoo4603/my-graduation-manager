package com.khuoo.gradmanager.micromajor.controller;

import com.khuoo.gradmanager.micromajor.dto.MicromajorStatusResponse;
import com.khuoo.gradmanager.micromajor.service.MicromajorService;
import com.khuoo.gradmanager.security.principal.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/micro-majors")
public class MicromajorController {

    private final CurrentUser currentUser;
    private final MicromajorService micromajorService;

    // 마이크로전공 상태 목록 조회
    @GetMapping("/status")
    public MicromajorStatusResponse status() {
        return micromajorService.getStatus(currentUser.userId());
    }
}
