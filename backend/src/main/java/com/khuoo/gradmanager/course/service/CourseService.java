package com.khuoo.gradmanager.course.service;

import com.khuoo.gradmanager.course.dto.CourseCreateRequest;
import com.khuoo.gradmanager.course.dto.CourseCreateResponse;
import com.khuoo.gradmanager.course.dto.CourseItem;
import com.khuoo.gradmanager.course.dto.CourseListResponse;
import com.khuoo.gradmanager.course.repository.CourseRepository;
import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    // 수강 내역 등록
    @Transactional
    public CourseCreateResponse create(long userId, CourseCreateRequest req) {

        long courseMasterId = requirePositive(req.courseMasterId());
        int earnedCredits = requirePositive(req.earnedCredits());
        String grade = normalizeRequired(req.grade());
        int takenYear = requirePositive(req.takenYear());
        String takenTerm = normalizeRequired(req.takenTerm());

        Long majorId = req.majorId();

        // majorId가 null/0이하이면 안됨
        if (majorId != null && majorId <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        long courseId = courseRepository.insert(
                userId,
                courseMasterId,
                earnedCredits,
                grade,
                takenYear,
                takenTerm,
                majorId
        );

        return new CourseCreateResponse(courseId);
    }

    // 수강 내역 조회
    @Transactional(readOnly = true)
    public CourseListResponse list(long userId, Integer year, String term) {

        boolean hasYear = (year != null);
        boolean hasTerm = (term != null && !term.trim().isBlank());

        List<CourseItem> items;

        // year/term이 모두 없으면 전체 조회
        if (!hasYear && !hasTerm) {
            items = courseRepository.findAllByUser(userId);
            return new CourseListResponse(items);
        }

        // year/term이 모두 있을 경우 해당 년도/학기 조회
        if (hasYear && hasTerm) {
            int normalizedYear = requirePositive(year);
            String normalizedTerm = normalizeRequired(term);
            items = courseRepository.findByUserAndTerm(userId, normalizedYear, normalizedTerm);
            return new CourseListResponse(items);
        }

        // 한쪽만 존재하면 요청 오류로 처리 (년도 조회, 학기 조회 제공X)
        throw new ApiException(ErrorCode.INVALID_REQUEST);
    }

    // 수강 내역 삭제
    @Transactional
    public void delete(long userId, long courseId) {

        // 0이하의 값은 존재할 수 없음. (요청 오류)
        long VAL_courseId = requirePositive(courseId);

        int affected = courseRepository.deleteByIdAndUser(VAL_courseId, userId);

        // 사용자의 수강내역 중 courseId와 일치하는 row가 없음.
        if (affected == 0) {
            throw new ApiException(ErrorCode.COURSE_NOT_FOUND);
        }
    }

    // 0 이하 값 요청 오류 처리
    private long requirePositive(long value) {
        // 0 이하 값은 허용하지 않음
        if (value <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        return value;
    }

    // null 또는 0 이하 값 요청 오류 처리
    private int requirePositive(Integer value) {
        // null 또는 0 이하 값은 허용하지 않음
        if (value == null || value <= 0) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        return value;
    }

    // null/blank 문자열 요청 오류 처리
    private String normalizeRequired(String value) {
        // null은 허용하지 않음
        if (value == null) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        String trimmed = value.trim();

        // blank 문자열은 허용하지 않음
        if (trimmed.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        return trimmed;
    }
}