package com.khuoo.gradmanager.profile.mapper;

import com.khuoo.gradmanager.profile.dto.ProfileResponse;
import com.khuoo.gradmanager.profile.repository.MajorRepository;
import com.khuoo.gradmanager.profile.repository.ProfileRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;


//Profile DTO 변환 담당 클래스, Repository에서 조회한 프로필, 전공을 조합
@Component
public class ProfileMapper {

    /**
     * ProfileResponse DTO로 조립
     *
     * @param base      사용자 기본 정보 + 학부 + 템플릿(학번) 정보
     * @param majorRows 사용자 전공 목록 (0개 이상)
     * @return ProfileResponse
     */
    public ProfileResponse toProfileResponse(ProfileRepository.ProfileBase base,
                                             List<MajorRepository.UserMajorRow> majorRows) {

        // 사용자 기본 정보
        ProfileResponse.UserDto userDto = new ProfileResponse.UserDto(
                base.userId(),
                base.email(),
                base.userName()
        );

        // 사용자 학부 정보
        ProfileResponse.DepartmentDto departmentDto = new ProfileResponse.DepartmentDto(
                base.departmentId(),
                base.departmentName()
        );

        // 사용자 템플릿(학번) 정보
        // template_id가 null이 아닐 때만 TemplateDto 생성
        ProfileResponse.TemplateDto template = null;
        if (base.templateId() != null) {
            template = new ProfileResponse.TemplateDto(
                    base.templateId(),
                    base.templateName(),
                    base.applicableYear()
            );
        }

        // 사용자 전공 목록
        List<ProfileResponse.MajorDto> majors = new ArrayList<>();

        for (MajorRepository.UserMajorRow r : majorRows) {

            ProfileResponse.MajorDto dto =
                    new ProfileResponse.MajorDto(
                            r.majorId(),
                            r.majorName(),
                            r.majorType()
                    );
            majors.add(dto);
        }

        // 최종 ProfileResponse 조립
        return new ProfileResponse(
                userDto,
                departmentDto,
                template,  // 값이 없으면 null하나만
                majors     // 값이 없으면 빈 리스트
        );
    }
}