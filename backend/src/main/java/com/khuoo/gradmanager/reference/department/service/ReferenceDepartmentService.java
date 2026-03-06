package com.khuoo.gradmanager.reference.department.service;

import com.khuoo.gradmanager.reference.department.dto.DepartmentListResponse;
import com.khuoo.gradmanager.reference.department.repository.ReferenceDepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class ReferenceDepartmentService {
    private final ReferenceDepartmentRepository referenceDepartmentRepository;

    // 전체 학부 목록을 응답 DTO 감싸 반환
    public DepartmentListResponse getDepartments() {
        return new DepartmentListResponse(
                referenceDepartmentRepository.findAll()
        );
    }
}