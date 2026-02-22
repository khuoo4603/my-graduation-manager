package com.khuoo.gradmanager.course.repository;

import com.khuoo.gradmanager.course.dto.CourseItem;

import java.util.List;

public interface CourseRepository {

    /**
     * 수강 내역 등록(INSERT) 후 생성된 course_id를 반환
     *
     * @param userId         현재 로그인 사용자 PK
     * @param courseMasterId 참조 과목 마스터 PK(course_master_id)
     * @param earnedCredits  사용자가 취득한 학점(earned_credits)
     * @param grade          성적(grade) ex. A+, A0, P, NP
     * @param takenYear      수강 연도(taken_year) ex. 2026
     * @param takenTerm      수강 학기(taken_term) ex. 1, 2, 여름 계절학기
     * @param majorId        학점 귀속 전공 PK(major_id), 없으면 null
     * @return 생성된 course_id
     */
    long insert(
            long userId,
            long courseMasterId,
            int earnedCredits,
            String grade,
            int takenYear,
            String takenTerm,
            Long majorId
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