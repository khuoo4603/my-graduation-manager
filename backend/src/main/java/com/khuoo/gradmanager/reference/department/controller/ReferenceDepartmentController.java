package com.khuoo.gradmanager.reference.department.controller;

import com.khuoo.gradmanager.reference.department.dto.DepartmentListResponse;
import com.khuoo.gradmanager.reference.department.service.ReferenceDepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reference")
public class ReferenceDepartmentController {


    private final ReferenceDepartmentService referenceDepartmentService;

    // 전체 학부 목록 반환
    @GetMapping("/departments")
    public DepartmentListResponse getDepartments() {
        return referenceDepartmentService.getDepartments();
    }
}