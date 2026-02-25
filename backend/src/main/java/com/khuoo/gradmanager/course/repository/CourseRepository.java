package com.khuoo.gradmanager.course.repository;

import com.khuoo.gradmanager.course.dto.CourseItem;

import java.util.List;

public interface CourseRepository {

    /**
     * 수강 내역 등록
     *
     * @param userId                  현재 로그인 사용자 PK
     * @param courseMasterId          강의목록 PK
     * @param earnedCredits           취득 학점
     * @param grade                   성적 ex. A+, A0, P, NP
     * @param takenYear               수강 연도 ex. 2026
     * @param takenTerm               수강 학기 ex. 1, 2, 여름 계절학기
     * @param recognitionType         전공 인정 유형, 교양: null / 전공: 전공탐색, 전공선택, 전공필수
     * @param majorId                 전공 PK, 교양: null / 전공: 전공ID
     * @param attributedDepartmentId  학부 PK, 전공탐색 이외 null / 전공탐색: 학부ID
     * @return 생성된 course_id
     */
    long insert(
            long userId,
            long courseMasterId,
            int earnedCredits,
            String grade,
            int takenYear,
            String takenTerm,
            String recognitionType,
            Long majorId,
            Long attributedDepartmentId
    );

    /**
     * 사용자 수강 내역 조회(전체)
     *
     * @param userId 현재 로그인 사용자 PK
     * @return 수강 내역(최신순)
     */
    List<CourseItem> findAllByUser(long userId);

    /**
     * 사용자 수강 내역 조회(특정 년도/학기)
     *
     * @param userId 현재 로그인 사용자 PK
     * @param year   수강 연도
     * @param term   수강 학기
     * @return 수강 내역(최신순)
     */
    List<CourseItem> findByUserAndTerm(long userId, int year, String term);

    /**
     * 수강 내역 삭제
     *
     * @param courseId 삭제할 수강 기록 PK(course_id)
     * @param userId   현재 로그인 사용자 PK
     * @return 삭제된 row 수(0 또는 1)
     */
    int deleteByIdAndUser(long courseId, long userId);
}