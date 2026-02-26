-- V2__constraints_and_indexes.sql - CHECK + INDEX

-- users
ALTER TABLE users
    ADD CONSTRAINT chk__users__role
        CHECK (role IN ('USER', 'ADMIN'));

CREATE INDEX IF NOT EXISTS idx__users__department_id
    ON users(department_id);

CREATE INDEX IF NOT EXISTS idx__users__template_id
    ON users(template_id);


-- user_major
ALTER TABLE user_major
    ADD CONSTRAINT chk__user_major__major_type
        CHECK (major_type IN ('심화전공', '주전공', '부전공', '복수전공'));

CREATE INDEX IF NOT EXISTS idx__user_major__user_id
    ON user_major(user_id);

CREATE INDEX IF NOT EXISTS idx__user_major__major_id
    ON user_major(major_id);


-- major_credit_rule
ALTER TABLE major_credit_rule
    ADD CONSTRAINT chk__major_credit_rule__major_type
        CHECK (major_type IN ('심화전공', '주전공', '부전공', '복수전공'));

-- 전공총 필요학점 < 전공필수 최소 필요학점 허용하지 않음
ALTER TABLE major_credit_rule
    ADD CONSTRAINT chk__major_credit_rule__total_gte_core
        CHECK (required_major_total_credits >= required_major_core_credits);

CREATE INDEX IF NOT EXISTS idx__major_credit_rule__major_id
    ON major_credit_rule(major_id);


-- culture_credit_rule
ALTER TABLE culture_credit_rule
    ADD CONSTRAINT chk__culture_credit_rule__rule_category
        CHECK (rule_category IN ('교양필수', '채플', 'SEED', '교양선택', '평생교육'));

CREATE INDEX IF NOT EXISTS idx__culture_credit_rule__template_id
    ON culture_credit_rule(template_id);


-- culture_credit_rule_seed
ALTER TABLE culture_credit_rule_seed
    ADD CONSTRAINT chk__culture_credit_rule_seed__seed_name
        CHECK (seed_name IN ('Science', 'Economy', 'Environment', 'Diversity'));

CREATE INDEX IF NOT EXISTS idx__culture_credit_rule_seed__culture_credit_rule_id
    ON culture_credit_rule_seed(culture_credit_rule_id);


-- course_master
-- course_subcategory 허용값:
--  - 교양: 교양필수/채플/SEED/교양선택/평생교육
--  - 전공: 전공필수/전공탐색/전공선택
-- seed_area는 교양+SEED에서만 허용
ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__course_category
        CHECK (course_category IN ('교양', '전공'));

ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__course_subcategory
        CHECK (course_subcategory IN ('교양필수', '채플', 'SEED', '교양선택', '평생교육', '전공필수', '전공탐색', '전공선택'));

ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__seed_area_enum
        CHECK (seed_area IS NULL OR seed_area IN ('Science', 'Economy', 'Environment', 'Diversity'));

ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__seed_scope
        CHECK (seed_area IS NULL OR (course_category = '교양' AND course_subcategory = 'SEED'));

ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__opened_term
        CHECK (opened_term IN ('1', '2', '여름 계절학기', '겨울 계절학기'));

ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__subcategory_scope
        CHECK (
            (course_category = '교양' AND course_subcategory IN ('교양필수', '채플', 'SEED', '교양선택', '평생교육'))
                OR
            (course_category = '전공' AND course_subcategory IN ('전공필수', '전공탐색', '전공선택'))
            );

CREATE INDEX IF NOT EXISTS idx__course_master__course_code
    ON course_master(course_code);

CREATE INDEX IF NOT EXISTS idx__course_master__opened_year
    ON course_master(opened_year);

CREATE INDEX IF NOT EXISTS idx__course_master__opened_term
    ON course_master(opened_term);

CREATE INDEX IF NOT EXISTS idx__course_master__course_category
    ON course_master(course_category);

CREATE INDEX IF NOT EXISTS idx__course_master__course_subcategory
    ON course_master(course_subcategory);


-- course_master_department_access
CREATE INDEX IF NOT EXISTS idx__cm_dept_access__course_master_id
    ON course_master_department_access(course_master_id);

CREATE INDEX IF NOT EXISTS idx__cm_dept_access__department_id
    ON course_master_department_access(department_id);


-- course
-- recognition_type 허용값: 전공필수/전공탐색/전공선택/NULL(교양)
--  1) 교양 입력: recognition_type/major_id/attributed_department_id 모두 NULL
--  2) 전공필수/전공선택: major_id NOT NULL, attributed_department_id NULL
--  3) 전공탐색: major_id NULL, attributed_department_id NOT NULL
ALTER TABLE course
    ADD CONSTRAINT chk__course__recognition_type
        CHECK (recognition_type IS NULL OR recognition_type IN ('전공필수', '전공탐색', '전공선택'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__taken_term
        CHECK (taken_term IN ('1', '2', '여름 계절학기', '겨울 계절학기'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__grade
        CHECK (grade IN ('A+','A0','B+','B0','C+','C0','D+','D0','F','P','NP'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__major_required_when_recognition
        CHECK (
            (recognition_type IS NULL AND major_id IS NULL AND attributed_department_id IS NULL)
                OR
            (recognition_type IN ('전공필수', '전공선택') AND major_id IS NOT NULL AND attributed_department_id IS NULL)
                OR
            (recognition_type = '전공탐색' AND major_id IS NULL AND attributed_department_id IS NOT NULL)
            );

CREATE INDEX IF NOT EXISTS idx__course__user_id
    ON course(user_id);

CREATE INDEX IF NOT EXISTS idx__course__course_master_id
    ON course(course_master_id);

CREATE INDEX IF NOT EXISTS idx__course__major_id
    ON course(major_id);

CREATE INDEX IF NOT EXISTS idx__course__attributed_department_id
    ON course(attributed_department_id);


-- file_metadata : INDEX
CREATE INDEX IF NOT EXISTS idx__file_metadata__user_id
    ON file_metadata(user_id);
