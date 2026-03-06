package com.khuoo.gradmanager.reference.major.repository;

import com.khuoo.gradmanager.reference.major.dto.MajorItem;

import java.util.List;


public interface MajorRepository {

    // 전체 전공 목록 조회
    List<MajorItem> findAll();

    // 특정 학부 전공 조회
    List<MajorItem> findByDepartmentId(long departmentId);

    // 전공 존재 여부 확인
    boolean existsById(long majorId);
}