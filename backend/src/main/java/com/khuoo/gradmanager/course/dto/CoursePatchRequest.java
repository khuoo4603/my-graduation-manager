package com.khuoo.gradmanager.course.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Getter;
import lombok.experimental.Accessors;

// 수강 내역 부분 수정 요청
@Getter
@Accessors(fluent = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class CoursePatchRequest {

    private Long courseMasterId;
    private Integer earnedCredits;
    private String grade;
    private Integer takenYear;
    private String takenTerm;
    private String courseSubcategory;
    private Long majorId;
    private Long attributedDepartmentId;
    private Long retakeCourseId;

    @JsonIgnore
    private boolean courseMasterIdPresent;
    @JsonIgnore
    private boolean earnedCreditsPresent;
    @JsonIgnore
    private boolean gradePresent;
    @JsonIgnore
    private boolean takenYearPresent;
    @JsonIgnore
    private boolean takenTermPresent;
    @JsonIgnore
    private boolean courseSubcategoryPresent;
    @JsonIgnore
    private boolean majorIdPresent;
    @JsonIgnore
    private boolean attributedDepartmentIdPresent;
    @JsonIgnore
    private boolean retakeCourseIdPresent;


    // 각 필드가 요청 JSON에 포함되었는지 여부 확인
    public boolean hasCourseMasterId() { return courseMasterIdPresent; }
    public boolean hasEarnedCredits() { return earnedCreditsPresent; }
    public boolean hasGrade() { return gradePresent; }
    public boolean hasTakenYear() { return takenYearPresent; }
    public boolean hasTakenTerm() { return takenTermPresent; }
    public boolean hasCourseSubcategory() { return courseSubcategoryPresent; }
    public boolean hasMajorId() { return majorIdPresent; }
    public boolean hasAttributedDepartmentId() { return attributedDepartmentIdPresent; }
    public boolean hasRetakeCourseId() { return retakeCourseIdPresent; }


    // 필드가 요청에 포함되면 present 플래그를 함께 기록
    @JsonSetter("courseMasterId")
    public void setCourseMasterId(Long courseMasterId) {
        this.courseMasterIdPresent = true;
        this.courseMasterId = courseMasterId;
    }

    @JsonSetter("earnedCredits")
    public void setEarnedCredits(Integer earnedCredits) {
        this.earnedCreditsPresent = true;
        this.earnedCredits = earnedCredits;
    }

    @JsonSetter("grade")
    public void setGrade(String grade) {
        this.gradePresent = true;
        this.grade = grade;
    }

    @JsonSetter("takenYear")
    public void setTakenYear(Integer takenYear) {
        this.takenYearPresent = true;
        this.takenYear = takenYear;
    }

    @JsonSetter("takenTerm")
    public void setTakenTerm(String takenTerm) {
        this.takenTermPresent = true;
        this.takenTerm = takenTerm;
    }

    @JsonSetter("courseSubcategory")
    public void setCourseSubcategory(String courseSubcategory) {
        this.courseSubcategoryPresent = true;
        this.courseSubcategory = courseSubcategory;
    }

    @JsonSetter("majorId")
    public void setMajorId(Long majorId) {
        this.majorIdPresent = true;
        this.majorId = majorId;
    }

    @JsonSetter("attributedDepartmentId")
    public void setAttributedDepartmentId(Long attributedDepartmentId) {
        this.attributedDepartmentIdPresent = true;
        this.attributedDepartmentId = attributedDepartmentId;
    }

    @JsonSetter("retakeCourseId")
    public void setRetakeCourseId(Long retakeCourseId) {
        this.retakeCourseIdPresent = true;
        this.retakeCourseId = retakeCourseId;
    }
}
