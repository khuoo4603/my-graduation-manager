-- V3__indexes.sql
-- INDEX 전용
-- partial unique index 포함

-- users
CREATE INDEX IF NOT EXISTS idx__users__department_id
    ON users(department_id);

CREATE INDEX IF NOT EXISTS idx__users__template_id
    ON users(template_id);


-- user_major
CREATE INDEX IF NOT EXISTS idx__user_major__user_id
    ON user_major(user_id);

CREATE INDEX IF NOT EXISTS idx__user_major__major_id
    ON user_major(major_id);


-- major_credit_rule
CREATE INDEX IF NOT EXISTS idx__major_credit_rule__major_id
    ON major_credit_rule(major_id);


-- culture_credit_rule
CREATE INDEX IF NOT EXISTS idx__culture_credit_rule__template_id
    ON culture_credit_rule(template_id);


-- culture_credit_rule_seed
CREATE INDEX IF NOT EXISTS idx__culture_credit_rule_seed__culture_credit_rule_id
    ON culture_credit_rule_seed(culture_credit_rule_id);


-- course_master
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
CREATE INDEX IF NOT EXISTS idx__course__user_id
    ON course(user_id);

CREATE INDEX IF NOT EXISTS idx__course__course_master_id
    ON course(course_master_id);

CREATE INDEX IF NOT EXISTS idx__course__major_id
    ON course(major_id);

CREATE INDEX IF NOT EXISTS idx__course__attributed_department_id
    ON course(attributed_department_id);

CREATE INDEX IF NOT EXISTS idx__course__retake_course_id
    ON course(retake_course_id);

CREATE INDEX IF NOT EXISTS idx__course__course_code_snapshot
    ON course(course_code_snapshot);

CREATE INDEX IF NOT EXISTS idx__course__course_category
    ON course(course_category);

CREATE INDEX IF NOT EXISTS idx__course__course_subcategory
    ON course(course_subcategory);

CREATE INDEX IF NOT EXISTS idx__course__seed_area
    ON course(seed_area);

-- 카탈로그 기반 등록: 같은 user/course_master/year/term 중복 방지
CREATE UNIQUE INDEX uq__course__catalog_based
    ON course(user_id, course_master_id, taken_year, taken_term)
    WHERE course_master_id IS NOT NULL;

-- 수동 등록: 같은 user/code/name/year/term 중복 방지
CREATE UNIQUE INDEX uq__course__manual_based
    ON course(user_id, course_code_snapshot, course_name_snapshot, taken_year, taken_term)
    WHERE course_master_id IS NULL;


-- file_metadata
CREATE INDEX IF NOT EXISTS idx__file_metadata__user_id
    ON file_metadata(user_id);