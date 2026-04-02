package com.khuoo.gradmanager.course.repository;

import com.khuoo.gradmanager.course.dto.CourseItem;

import java.util.List;
import java.util.Optional;

public interface CourseRepository {

    /**
     * 수강 내역 등록
     *
     * @param userId                  현재 로그인 사용자 PK
     * @param courseMasterId          강의목록 PK
     * @param courseCodeSnapshot      과목코드 스냅샷
     * @param courseNameSnapshot      과목명 스냅샷
     * @param courseCategory          전공/교양 스냅샷
     * @param courseSubcategory       세부 카테고리 스냅샷
     * @param seedArea                SEED 영역 스냅샷
     * @param earnedCredits           취득 학점
     * @param grade                   성적 ex. A+, A0, P, NP
     * @param takenYear               수강 연도 ex. 2026
     * @param takenTerm               수강 학기 ex. 1, SUMMER, 2, WINTER
     * @param recognitionType         전공 인정 유형, 교양: null / 전공: 전공탐색, 전공선택, 전공필수
     * @param majorId                 전공 PK, 교양: null / 전공: 전공ID
     * @param attributedDepartmentId  학부 PK, 전공탐색 이외 null / 전공탐색: 학부ID
     * @param retakeCourseId          재수강 대상 수강내역 PK
     * @return 생성된 course_id
     */
    long insert(
            long userId,
            long courseMasterId,
            String courseCodeSnapshot,
            String courseNameSnapshot,
            String courseCategory,
            String courseSubcategory,
            String seedArea,
            int earnedCredits,
            String grade,
            int takenYear,
            String takenTerm,
            String recognitionType,
            Long majorId,
            Long attributedDepartmentId,
            Long retakeCourseId
    );

    /**
     * 수강 내역 수정
     *
     * @param courseId                수정할 수강내역 PK
     * @param userId                  현재 로그인 사용자 PK
     * @param courseNameSnapshot      과목명 스냅샷
     * @param courseCategory          전공/교양 스냅샷
     * @param courseSubcategory       세부 카테고리
     * @param seedArea                SEED 영역
     * @param recognitionType         전공 인정 유형
     * @param majorId                 전공 PK
     * @param attributedDepartmentId  귀속 학부 PK
     * @param earnedCredits           취득 학점
     * @param grade                   성적
     * @param takenYear               수강 연도
     * @param takenTerm               수강 학기
     * @param retakeCourseId          재수강 대상 수강내역 PK
     * @return 수정된 row 수
     */
    int update(
            long courseId,
            long userId,
            String courseNameSnapshot,
            String courseCategory,
            String courseSubcategory,
            String seedArea,
            String recognitionType,
            Long majorId,
            Long attributedDepartmentId,
            int earnedCredits,
            String grade,
            int takenYear,
            String takenTerm,
            Long retakeCourseId
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
     * 등록/수정 검증용 수강 내역 단건 조회
     *
     * @param courseId 수강 내역 PK
     * @return 수강 내역 검증용 row
     */
    Optional<CourseWriteRow> findWriteRowById(long courseId);

    /**
     * 동일 사용자/과목/연도/학기 중복 여부 확인
     *
     * @param userId          현재 로그인 사용자 PK
     * @param courseMasterId  강의목록 PK
     * @param takenYear       수강 연도
     * @param takenTerm       수강 학기
     * @param excludeCourseId 수정 시 제외할 course_id, 등록이면 null
     * @return 중복 여부
     */
    boolean existsDuplicate(long userId, long courseMasterId, int takenYear, String takenTerm, Long excludeCourseId);

    /**
     * 수강 내역 삭제
     *
     * @param courseId 삭제할 수강 기록 PK(course_id)
     * @param userId   현재 로그인 사용자 PK
     * @return 삭제된 row 수(0 또는 1)
     */
    int deleteByIdAndUser(long courseId, long userId);

    /**
     * 사용자 수강 내역 전체 삭제
     *
     * @param userId 현재 로그인 사용자 PK
     */
    void deleteByUserId(long userId);

    // 등록/수정 검증에 사용하는 최소 수강 내역 정보
    record CourseWriteRow(
            long courseId,
            long userId,
            Long courseMasterId,
            Integer earnedCredits,
            String grade,
            Integer takenYear,
            String takenTerm,
            Long majorId,
            Long attributedDepartmentId,
            Long retakeCourseId,
            String courseCodeSnapshot,
            String courseNameSnapshot,
            String courseCategory,
            String courseSubcategory,
            String seedArea
    ) {}
}
