package com.khuoo.gradmanager.profile.controller;

import com.khuoo.gradmanager.profile.dto.*;
import com.khuoo.gradmanager.profile.service.ProfileMajorService;
import com.khuoo.gradmanager.profile.service.ProfileService;
import com.khuoo.gradmanager.security.principal.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final CurrentUser currentUser;
    private final ProfileMajorService profileMajorService;

    // 내 프로필 조회
    @GetMapping
    public ProfileResponse getProfile() {
        return profileService.getMyProfile();
    }

    // 내 템플릿 변경
    @PutMapping("/template")
    public ResponseEntity<Void> updateTemplate(@RequestBody @Valid UpdateTemplateRequest request) {
        profileService.updateMyTemplate(request.templateId());
        return ResponseEntity.noContent().build();
    }

    // 내 학부 변경
    @PutMapping("/department")
    public ResponseEntity<Void> updateDepartment(@RequestBody @Valid UpdateDepartmentRequest request) {
        profileService.updateMyDepartment(request.departmentId());
        return ResponseEntity.noContent().build();
    }

    // 내 이름 변경
    @PutMapping("/name")
    public ResponseEntity<Void> updateName(@RequestBody UpdateNameRequest request) {
        profileService.updateMyName(request.name());
        return ResponseEntity.noContent().build();
    }

    // 내 전공 추가
    @PostMapping("/major")
    @ResponseStatus(HttpStatus.CREATED)
    public AddUserMajorResponse addUserMajor(@Valid @RequestBody AddUserMajorRequest request) {
        return profileMajorService.addUserMajor(currentUser.userId(), request);
    }

    // 내 전공 삭제
    @DeleteMapping("/major/{userMajorId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserMajor(@PathVariable long userMajorId) {
        profileMajorService.deleteUserMajor(currentUser.userId(), userMajorId);
    }
}