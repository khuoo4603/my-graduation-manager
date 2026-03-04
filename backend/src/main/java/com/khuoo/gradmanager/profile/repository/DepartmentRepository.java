package com.khuoo.gradmanager.profile.repository;

public interface DepartmentRepository {

    // 학부 존재 여부 확인
    boolean existsByDepartmentId(Long departmentId);
}