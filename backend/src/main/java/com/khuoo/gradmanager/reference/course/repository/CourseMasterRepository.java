package com.khuoo.gradmanager.reference.course.repository;

import com.khuoo.gradmanager.reference.course.dto.CourseMasterSearchItem;

import java.util.List;

public interface CourseMasterRepository {

    List<CourseMasterSearchItem> search(
            int openedYear,
            String openedTerm,
            String courseCode,
            String courseName,
            String courseCategory,
            String courseSubcategory,
            String departmentName
    );
}