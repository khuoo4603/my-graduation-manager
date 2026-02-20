package com.khuoo.gradmanager.profile.controller;

import com.khuoo.gradmanager.profile.dto.ProfileResponse;
import com.khuoo.gradmanager.profile.dto.UpdateTemplateRequest;
import com.khuoo.gradmanager.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // 내 프로필 조회
    @GetMapping
    public ProfileResponse getProfile() {
        return profileService.getMyProfile();
    }

    // 내 템플릿 변경
    @PutMapping("/template")
    public ResponseEntity<Void> updateTemplate(@RequestBody @Valid UpdateTemplateRequest request) {
        profileService.updateMyTemplate(request.getTemplateId());

        return ResponseEntity.noContent().build();
    }
}