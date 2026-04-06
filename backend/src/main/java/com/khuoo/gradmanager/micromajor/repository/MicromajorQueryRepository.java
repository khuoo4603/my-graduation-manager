package com.khuoo.gradmanager.micromajor.repository;

import com.khuoo.gradmanager.micromajor.loadmodel.MicromajorLoadData;

public interface MicromajorQueryRepository {

    // 마이크로전공 상태 판정에 필요한 기준/사용자 데이터를 한 번에 로드
    MicromajorLoadData load(long userId);
}
