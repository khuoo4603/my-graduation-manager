-- V2: CHECK 및 INDEX 추가
-- CHECK 이름 규칙(통일): chk__{table}__{column_or_rule}
-- INDEX 이름 규칙: idx__{table}__{column}


-- 1) CHECK constraints
-- users.role: USER/ADMIN
ALTER TABLE users
    ADD CONSTRAINT chk__users__role
        CHECK (role IN ('USER', 'ADMIN'));

-- user_major.major_type: 한글 전공 구분
ALTER TABLE user_major
    ADD CONSTRAINT chk__user_major__major_type
        CHECK (major_type IN ('심화전공', '주전공', '부전공', '복수전공'));

-- major_credit_rule.major_type: user_major와 동일 도메인
ALTER TABLE major_credit_rule
    ADD CONSTRAINT chk__major_credit_rule__major_type
        CHECK (major_type IN ('심화전공', '주전공', '부전공', '복수전공'));

-- culture_credit_rule.rule_category: 교양 규칙 카테고리
ALTER TABLE culture_credit_rule
    ADD CONSTRAINT chk__culture_credit_rule__rule_category
        CHECK (rule_category IN ('교양필수', '미래혁신', '채플', '소양'));

-- culture_credit_rule_seed.seed_name: SEED 영역
ALTER TABLE culture_credit_rule_seed
    ADD CONSTRAINT chk__culture_credit_rule_seed__seed_name
        CHECK (seed_name IN ('Science', 'Economy', 'Environment', 'Diversity'));

-- course_master.course_category: 교양/전공
ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__course_category
        CHECK (course_category IN ('교양', '전공'));

-- course_master.course_subcategory: 세부 구분
ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__course_subcategory
        CHECK (course_subcategory IN (
                                      '교양필수', '미래혁신', '소양', '채플',
                                      '전공필수', '전공탐색', '전공선택'
            ));

-- course_master.seed_area: SEED 영역값 자체 허용 범위 (NULL 허용)
ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__seed_area
        CHECK (seed_area IS NULL OR seed_area IN ('Science', 'Economy', 'Environment', 'Diversity'));

-- course_master.seed_area 스코프 규칙(교차 컬럼): "교양 + 미래혁신" 일 때만 seed_area 허용
ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__seed_area_scope
        CHECK (
            seed_area IS NULL
                OR (
                course_category = '교양'
                    AND course_subcategory = '미래혁신'
                )
            );

-- course_master.opened_term: 개설 학기
ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__opened_term
        CHECK (opened_term IN ('1', '2', '여름 계절학기', '겨울 계절학기'));

-- course_master_major.recognition_type: 전공 인정 유형
ALTER TABLE course_master_major
    ADD CONSTRAINT chk__course_master_major__recognition_type
        CHECK (recognition_type IN ('전공필수', '전공탐색', '전공선택'));

-- course.taken_term: 수강 학기
ALTER TABLE course
    ADD CONSTRAINT chk__course__taken_term
        CHECK (taken_term IN ('1', '2', '여름 계절학기', '겨울 계절학기'));

-- course.grade: 성적 코드(필요 시 확장)
ALTER TABLE course
    ADD CONSTRAINT chk__course__grade
        CHECK (grade IN ('A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F', 'P', 'NP'));



-- 2) Indexes (FK 컬럼 인덱스)
-- users
CREATE INDEX IF NOT EXISTS idx__users__department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx__users__template_id   ON users(template_id);

-- graduation_template
CREATE INDEX IF NOT EXISTS idx__graduation_template__department_id ON graduation_template(department_id);

-- major
CREATE INDEX IF NOT EXISTS idx__major__department_id ON major(department_id);

-- user_major
CREATE INDEX IF NOT EXISTS idx__user_major__user_id  ON user_major(user_id);
CREATE INDEX IF NOT EXISTS idx__user_major__major_id ON user_major(major_id);

-- major_credit_rule
CREATE INDEX IF NOT EXISTS idx__major_credit_rule__major_id ON major_credit_rule(major_id);

-- culture_credit_rule
CREATE INDEX IF NOT EXISTS idx__culture_credit_rule__template_id ON culture_credit_rule(template_id);

-- culture_credit_rule_seed
CREATE INDEX IF NOT EXISTS idx__culture_credit_rule_seed__culture_credit_rule_id
    ON culture_credit_rule_seed(culture_credit_rule_id);

-- course_master
CREATE INDEX IF NOT EXISTS idx__course_master__opened_department_id ON course_master(opened_department_id);

-- course_master_major
CREATE INDEX IF NOT EXISTS idx__course_master_major__course_master_id ON course_master_major(course_master_id);
CREATE INDEX IF NOT EXISTS idx__course_master_major__major_id         ON course_master_major(major_id);

-- course
CREATE INDEX IF NOT EXISTS idx__course__user_id          ON course(user_id);
CREATE INDEX IF NOT EXISTS idx__course__course_master_id ON course(course_master_id);
CREATE INDEX IF NOT EXISTS idx__course__major_id         ON course(major_id);

-- file_metadata
CREATE INDEX IF NOT EXISTS idx__file_metadata__user_id ON file_metadata(user_id);
