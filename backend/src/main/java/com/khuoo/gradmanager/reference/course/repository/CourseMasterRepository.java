package com.khuoo.gradmanager.reference.course.repository;

import java.util.List;

public interface CourseMasterRepository {

    /**
     * 요청한 개설연도/학기에 실제 개설된 과목 검색(조인 결과 row 단위)
     *
     * @param openedYear       개설연도(필수)
     * @param openedTerm       개설학기(필수)
     * @param courseCode       과목 코드(선택)
     * @param courseName       과목명(선택)
     * @param courseCategory   교양/전공(선택)
     * @param courseSubcategory 세부구분(선택)
     * @param departmentName   수강 가능 학부명(선택)
     * @return 조인 결과 row 리스트
     */
    List<CourseMasterSearchRow> searchOpenedRows(
            int openedYear,
            String openedTerm,
            String courseCode,
            String courseName,
            String courseCategory,
            String courseSubcategory,
            String departmentName
    );

    /**
     * 요청 년도에 반환 가능한 default 과목 검색(조인 결과 row 단위)
     *
     * @param openedYear       요청 연도(필수)
     * @param openedTerm       요청 학기(필수, 기존 파라미터 구조 유지)
     * @param courseCode       과목 코드(선택)
     * @param courseName       과목명(선택)
     * @param courseCategory   교양/전공(선택)
     * @param courseSubcategory 세부구분(선택)
     * @param departmentName   수강 가능 학부명(선택)
     * @return 조인 결과 row 리스트
     */
    List<CourseMasterSearchRow> searchDefaultRows(
            int openedYear,
            String openedTerm,
            String courseCode,
            String courseName,
            String courseCategory,
            String courseSubcategory,
            String departmentName
    );
}