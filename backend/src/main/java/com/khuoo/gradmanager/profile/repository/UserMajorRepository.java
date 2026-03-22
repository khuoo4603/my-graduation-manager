package com.khuoo.gradmanager.profile.repository;

import java.util.Optional;


public interface UserMajorRepository {

    // 사용자 동일 전공/전공타입이 이미 존재하는지 확인
    boolean existsByUserIdAndMajorIdAndMajorType(long userId, long majorId, String majorType);

    // 사용자에게 해당 전공이 하나라도 연결되어 있는지 확인
    boolean existsByUserIdAndMajorId(long userId, long majorId);

    // 사용자 전공 생성 후 id 반환
    long insert(long userId, long majorId, String majorType);

    // 특정 사용자 전공 1건 조회
    Optional<UserMajorRow> findById(long userMajorId);

    // 사용자 전공 삭제
    int deleteByIdAndUserId(long userMajorId, long userId);

    // 사용자 전공 전체 삭제
    void deleteByUserId(long userId);

    // user_major 조회 결과를 담는 row DTO
    record UserMajorRow(
            long userMajorId,
            long userId,
            long majorId,
            String majorType
    ) {}
}