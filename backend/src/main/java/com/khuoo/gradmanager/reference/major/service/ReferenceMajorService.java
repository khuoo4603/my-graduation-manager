package com.khuoo.gradmanager.reference.major.service;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.reference.department.repository.ReferenceDepartmentRepository;
import com.khuoo.gradmanager.reference.major.dto.MajorListResponse;
import com.khuoo.gradmanager.reference.major.repository.MajorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class ReferenceMajorService {
    private final ReferenceDepartmentRepository referenceDepartmentRepository;
    private final MajorRepository majorRepository;

    // departmentId 조건에 따라 전공 목록 반환
    public MajorListResponse getMajors(Long departmentId) {
        // departmentId가 없으면 전체 전공 반환
        if (departmentId == null) {
            return new MajorListResponse(
                    majorRepository.findAll()
            );
        }

        // 0 이하 학부 ID 요청 오류 처리
        if (departmentId <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 존재하지 않는 학부 조회 404로 처리
        if (!referenceDepartmentRepository.existsById(departmentId)) {
            throw new ApiException(ErrorCode.DEPARTMENT_NOT_FOUND);
        }

        // 해당 학부 전공 목록 반환
        return new MajorListResponse(
                majorRepository.findByDepartmentId(departmentId)
        );
    }
}