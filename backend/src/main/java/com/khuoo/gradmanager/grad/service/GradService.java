package com.khuoo.gradmanager.grad.service;

import com.khuoo.gradmanager.grad.dto.GraduationStatusResponse;
import com.khuoo.gradmanager.grad.loadmodel.GradLoadData;
import com.khuoo.gradmanager.grad.repository.GradQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Service
public class GradService {
    private static final String MISSING_DEPARTMENT_REASON = "MISSING_DEPARTMENT";
    private static final String MISSING_GRADUATION_TEMPLATE_REASON = "MISSING_GRADUATION_TEMPLATE";
    private static final String INSUFFICIENT_GRADUATION_CONTEXT_MESSAGE =
            "정보가 설정되지 않았거나 기준 정보가 부족하여 졸업판정을 수행할 수 없습니다.";
    private static final String MISSING_DEPARTMENT_MESSAGE =
            "학부 정보가 설정되지 않았거나 기준 정보가 부족하여 졸업판정을 수행할 수 없습니다.";
    private static final String MISSING_GRADUATION_TEMPLATE_MESSAGE =
            "졸업 템플릿 정보가 설정되지 않았거나 기준 정보가 부족하여 졸업판정을 수행할 수 없습니다.";

    private final GradQueryRepository gradQueryRepository;
    private final GraduationEvaluationService graduationEvaluationService;

    // 현재 사용자 졸업판정 상태 조회
    @Transactional(readOnly = true)
    public GraduationStatusResponse getStatus(long userId) {
        GradLoadData loadData = gradQueryRepository.load(userId); // 필요한 데이터를 DB에서 꺼낸 후 GradLoadData객체 생성
        List<String> missingContexts = new ArrayList<>(); // 판정에 필요한 기준 정보 중 비어 있는 항목 누적
        List<String> reasons = new ArrayList<>(); // 판정 불가 상세 사유 코드 누적

        if (loadData.userDepartmentId() == null) {
            missingContexts.add("학부");
            reasons.add(MISSING_DEPARTMENT_REASON);
        }
        if (loadData.template() == null) {
            missingContexts.add("졸업 템플릿");
            reasons.add(MISSING_GRADUATION_TEMPLATE_REASON);
        }

        // 누락된 기준 정보 존재 여부 검증
        if (!missingContexts.isEmpty()) {
            // 판정 불가 상태도 200 OK 응답 구조로 반환
            GraduationStatusResponse.Template template;
            if (loadData.template() == null) {
                template = GraduationStatusResponse.emptyTemplate();
            } else {
                template = new GraduationStatusResponse.Template(
                        loadData.template().templateId(),
                        loadData.template().templateName(),
                        loadData.template().applicableYear()
                );
            }

            String message = INSUFFICIENT_GRADUATION_CONTEXT_MESSAGE; // 누락 항목이 여러 개면 일반 안내 문구 사용
            if (reasons.size() == 1 && MISSING_DEPARTMENT_REASON.equals(reasons.get(0))) {
                message = MISSING_DEPARTMENT_MESSAGE;
            }
            if (reasons.size() == 1 && MISSING_GRADUATION_TEMPLATE_REASON.equals(reasons.get(0))) {
                message = MISSING_GRADUATION_TEMPLATE_MESSAGE;
            }
            if (reasons.size() > 1) {
                message = String.join(", ", missingContexts) + " " + INSUFFICIENT_GRADUATION_CONTEXT_MESSAGE;
            }

            return GraduationStatusResponse.nonEvaluable(
                    template,
                    !loadData.userMajors().isEmpty(),
                    reasons,
                    message
            );
        }

        return graduationEvaluationService.evaluate(loadData);
    }
}
