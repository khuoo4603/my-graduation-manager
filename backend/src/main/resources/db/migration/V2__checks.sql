-- V2__checks.sql
-- CHECK 제약 전용

-- users
ALTER TABLE users
    ADD CONSTRAINT chk__users__role
        CHECK (role IN ('USER', 'ADMIN'));


-- user_major
ALTER TABLE user_major
    ADD CONSTRAINT chk__user_major__major_type
        CHECK (major_type IN ('심화전공', '주전공', '부전공', '복수전공'));


-- major_credit_rule
ALTER TABLE major_credit_rule
    ADD CONSTRAINT chk__major_credit_rule__major_type
        CHECK (major_type IN ('심화전공', '주전공', '부전공', '복수전공'));

ALTER TABLE major_credit_rule
    ADD CONSTRAINT chk__major_credit_rule__total_gte_core
        CHECK (required_major_total_credits >= required_major_core_credits);


-- culture_credit_rule
ALTER TABLE culture_credit_rule
    ADD CONSTRAINT chk__culture_credit_rule__rule_category
        CHECK (rule_category IN ('교양필수', '채플', 'SEED', '교양선택', '평생교육'));


-- culture_credit_rule_seed
ALTER TABLE culture_credit_rule_seed
    ADD CONSTRAINT chk__culture_credit_rule_seed__seed_name
        CHECK (seed_name IN ('Science', 'Economy', 'Environment', 'Diversity'));


-- course_master
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
        CHECK (opened_term IS NULL OR opened_term IN ('1', 'SUMMER', '2', 'WINTER'));

ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__subcategory_scope
        CHECK (
            (course_category = '교양' AND course_subcategory IN ('교양필수', '채플', 'SEED', '교양선택', '평생교육'))
                OR
            (course_category = '전공' AND course_subcategory IN ('전공필수', '전공탐색', '전공선택'))
            );


-- course
ALTER TABLE course
    ADD CONSTRAINT chk__course__recognition_type
        CHECK (recognition_type IS NULL OR recognition_type IN ('전공필수', '전공탐색', '전공선택'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__taken_term
        CHECK (taken_term IN ('1', 'SUMMER', '2', 'WINTER'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__grade
        CHECK (grade IN ('A+','A0','B+','B0','C+','C0','D+','D0','F','P','NP'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__course_category
        CHECK (course_category IN ('교양', '전공'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__course_subcategory
        CHECK (course_subcategory IN ('교양필수', '채플', 'SEED', '교양선택', '평생교육', '전공필수', '전공탐색', '전공선택'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__seed_area_enum
        CHECK (seed_area IS NULL OR seed_area IN ('Science', 'Economy', 'Environment', 'Diversity'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__seed_scope
        CHECK (seed_area IS NULL OR (course_category = '교양' AND course_subcategory = 'SEED'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__subcategory_scope
        CHECK (
            (course_category = '교양' AND course_subcategory IN ('교양필수', '채플', 'SEED', '교양선택', '평생교육'))
                OR
            (course_category = '전공' AND course_subcategory IN ('전공필수', '전공탐색', '전공선택'))
            );

-- recognition_type, major_id, attributed_department_id, snapshot 정합성
--  교양: recognition_type / major_id / attributed_department_id 모두 NULL
--  전공필수 / 전공선택: major_id NOT NULL, attributed_department_id NULL
--  전공탐색: major_id NULL, attributed_department_id NOT NULL
ALTER TABLE course
    ADD CONSTRAINT chk__course__snapshot_and_recognition_consistency
        CHECK (
            (course_category = '교양'
                AND recognition_type IS NULL
                AND major_id IS NULL
                AND attributed_department_id IS NULL
                AND course_subcategory IN ('교양필수', '채플', 'SEED', '교양선택', '평생교육'))
                OR
            (course_category = '전공'
                AND course_subcategory IN ('전공필수', '전공선택')
                AND recognition_type = course_subcategory
                AND major_id IS NOT NULL
                AND attributed_department_id IS NULL)
                OR
            (course_category = '전공'
                AND course_subcategory = '전공탐색'
                AND recognition_type = '전공탐색'
                AND major_id IS NULL
                AND attributed_department_id IS NOT NULL)
            );