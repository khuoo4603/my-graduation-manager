package com.khuoo.gradmanager.reference.major.controller;

import com.khuoo.gradmanager.reference.major.dto.MajorListResponse;
import com.khuoo.gradmanager.reference.major.service.ReferenceMajorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reference")
public class ReferenceMajorController {
    private final ReferenceMajorService referenceMajorService;

    // 전공 목록 조회, departmentId 선택 -> 특정 학부 조회
    @GetMapping("/majors")
    public MajorListResponse getMajors(@RequestParam(required = false) Long departmentId) {
        return referenceMajorService.getMajors(departmentId);
    }
}