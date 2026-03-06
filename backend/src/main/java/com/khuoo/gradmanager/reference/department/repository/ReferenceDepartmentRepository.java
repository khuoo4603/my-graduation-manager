package com.khuoo.gradmanager.reference.department.repository;

import com.khuoo.gradmanager.reference.department.dto.DepartmentItem;

import java.util.List;

// 학부 카탈로그 조회 기능을 정의하는 인터페이스다.
public interface ReferenceDepartmentRepository {

    // 전체 학부 목록 조회
    List<DepartmentItem> findAll();

    // 학부 존재 여부 확인
    boolean existsById(long departmentId);
}