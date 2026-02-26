package com.khuoo.gradmanager.grad.service;

import com.khuoo.gradmanager.grad.dto.GraduationStatusResponse;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import com.khuoo.gradmanager.grad.repository.GradQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class GradService {

    private final GradQueryRepository gradQueryRepository;
    private final GraduationEvaluationService graduationEvaluationService;

    @Transactional(readOnly = true)
    public GraduationStatusResponse getStatus(long userId) {
        GradLoadData loadData = gradQueryRepository.load(userId); // 필요한 데이터를 DB에서 꺼낸 후 GradLoadData객체 생성
        return graduationEvaluationService.evaluate(loadData);
    }
}