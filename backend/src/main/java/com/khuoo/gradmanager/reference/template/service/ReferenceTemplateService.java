package com.khuoo.gradmanager.reference.template.service;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.reference.department.repository.ReferenceDepartmentRepository;
import com.khuoo.gradmanager.reference.template.dto.TemplateListResponse;
import com.khuoo.gradmanager.reference.template.repository.ReferenceTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class ReferenceTemplateService {
    private final ReferenceDepartmentRepository referenceDepartmentRepository;
    private final ReferenceTemplateRepository referenceTemplateRepository;

    // departmentId 조건에 따라 템플릿 목록을 반환
    public TemplateListResponse getTemplates(Long departmentId) {
        // departmentId가 없으면 전체 템플릿을 반환
        if (departmentId == null) {
            return new TemplateListResponse(
                    referenceTemplateRepository.findAll()
            );
        }

        // 0 이하 학부 ID는 요청 오류로 처리
        if (departmentId <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 존재하지 않는 학부 조회는 404로 처리
        if (!referenceDepartmentRepository.existsById(departmentId)) {
            throw new ApiException(ErrorCode.DEPARTMENT_NOT_FOUND);
        }

        // 해당 학부 템플릿 목록을 반환
        return new TemplateListResponse(
                referenceTemplateRepository.findByDepartmentId(departmentId)
        );
    }
}