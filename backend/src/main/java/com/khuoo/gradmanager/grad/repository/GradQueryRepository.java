package com.khuoo.gradmanager.grad.repository;

import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;


public interface GradQueryRepository {

    /**
     * 졸업판정에 필요한 모든 데이터를 로딩. (DB 사용자 수강이력 기준으로 데이터 검색)
     *
     * @param userId 사용자 PK(JWT의 userID 사용)
     * @return 모든 졸업판정 데이터(GradLoadData) 반환
     */
    GradLoadData load(long userId);
}