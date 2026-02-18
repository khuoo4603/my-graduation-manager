-- V1: 기본 테이블 생성 및 PK, FK, UNIQUE 제약조건 생성


-- department : 학과/학부 정보 테이블
-- 모든 전공과 졸업요건의 상위 조직 단위
CREATE TABLE department (
    department_id   BIGSERIAL PRIMARY KEY,           -- 학부 PK
    department_name VARCHAR(20) NOT NULL,            -- 학부명
    created_at      TIMESTAMP NOT NULL DEFAULT NOW() -- 생성 일시
);



-- graduation_template : 졸업요건 템플릿 테이블
-- 학과 + 적용년도 기준 졸업요건 규칙 묶음
CREATE TABLE graduation_template (
    template_id                     BIGSERIAL PRIMARY KEY,      -- 템플릿 PK
    department_id                   BIGINT NOT NULL,            -- 소속 학부 FK
    template_name                   VARCHAR(50) NOT NULL,       -- 템플릿 이름
    applicable_year                 SMALLINT NOT NULL,          -- 적용 학번/년도
    total_required_credits          SMALLINT NOT NULL,          -- 총 졸업 필요 학점
    total_culture_credits           SMALLINT NOT NULL,          -- 교양 총 필요 학점
    total_major_exploration_credits SMALLINT NOT NULL,          -- 전공탐색 필요 학점
    active                          BOOLEAN NOT NULL DEFAULT TRUE, -- 활성 여부
    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(), -- 생성 일시

    -- department_id -> department.department_id (졸업요건 템플릿은 반드시 하나의 학부에 속해야함.)
    CONSTRAINT fk_template_department
        FOREIGN KEY (department_id) REFERENCES department(department_id),

    CONSTRAINT uq_template_dept_year
        UNIQUE (department_id, applicable_year)
);



-- users : 사용자 기본 정보 테이블
-- 구글 로그인 기반 계정
CREATE TABLE users (
    user_id       BIGSERIAL PRIMARY KEY,       -- 사용자 PK (내부 숫자 ID)
    email         VARCHAR(320) NOT NULL,       -- 이메일 (OAuth 식별자)
    user_name     VARCHAR(50) NOT NULL,        -- 사용자 이름
    department_id BIGINT NOT NULL,             -- 소속 학부 FK
    role          VARCHAR(10) NOT NULL,        -- 권한 , USER/ADMIN
    template_id   BIGINT NULL,                 -- 적용 졸업요건 템플릿 FK
    joined_at     TIMESTAMP NOT NULL DEFAULT NOW(), -- 가입 일시
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(), -- 수정 일시

    -- department_id -> department.department_id (사용자는 반드시 하나의 학부에 소속되어야함.)
    CONSTRAINT fk_user_department
        FOREIGN KEY (department_id) REFERENCES department(department_id),

    -- template_id -> graduation_template.template_id (사용자는 하나의 졸업요건 템플릿을 선택할 수 있음. NULL 허용.)
    CONSTRAINT fk_user_template
        FOREIGN KEY (template_id) REFERENCES graduation_template(template_id),

    CONSTRAINT uq_user_email
        UNIQUE (email)
);




-- major : 전공 마스터 테이블
-- 학과 내 전공 정의
CREATE TABLE major (
    major_id      BIGSERIAL PRIMARY KEY,   -- 전공 PK
    department_id BIGINT NOT NULL,         -- 소속 학부 FK
    major_name    VARCHAR(200) NOT NULL,   -- 전공명
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(), -- 생성 일시

    -- department_id -> department.department_id (전공은 반드시 하나의 학부에 속해야함.)
    CONSTRAINT fk_major_department
        FOREIGN KEY (department_id) REFERENCES department(department_id),

    CONSTRAINT uq_major_dept_name
        UNIQUE (department_id, major_name)
);



-- user_major : 사용자-전공 매핑 테이블
-- 복수전공/부전공 구조 지원
CREATE TABLE user_major (
    user_major_id BIGSERIAL PRIMARY KEY,   -- 매핑 PK
    user_id       BIGINT NOT NULL,         -- 사용자 FK
    major_id      BIGINT NOT NULL,         -- 전공 FK
    major_type    VARCHAR(6) NOT NULL,     -- 전공 구분 , 심화전공/주전공/부전공/복수전공
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(), -- 생성 일시

    -- user_id -> users.user_id (사용자-전공 매핑은 반드시 특정 사용자에 속해야함.)
    CONSTRAINT fk_user_major_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),

    -- major_id -> major.major_id (사용자-전공 매핑은 반드시 특정 전공에 속해야함.)
    CONSTRAINT fk_user_major_major
        FOREIGN KEY (major_id) REFERENCES major(major_id),

    CONSTRAINT uq_user_major_unique
        UNIQUE (user_id, major_id, major_type)
);



-- major_credit_rule : 전공 학점 규칙 테이블
-- 전공 유형별 필요 학점 정의
CREATE TABLE major_credit_rule (
    major_credit_rule_id            BIGSERIAL PRIMARY KEY,      -- 전공 규칙 PK
    major_id                        BIGINT NOT NULL,            -- 전공 FK
    major_type                      VARCHAR(8) NOT NULL,        -- 심화전공/주전공/부전공/복수전공
    required_major_core_credits     SMALLINT NOT NULL,          -- 전공필수 필요 학점
    required_major_elective_credits SMALLINT NOT NULL,          -- 전공선택 필요 학점
    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(), -- 생성 일시

    -- major_id -> major.major_id (전공 학점 규칙은 반드시 특정 전공에 속해야함.)
    CONSTRAINT fk_major_rule_major
        FOREIGN KEY (major_id) REFERENCES major(major_id),

    CONSTRAINT uq_major_rule_unique
        UNIQUE (major_id, major_type)
);



-- culture_credit_rule : 교양/영역 규칙 테이블
-- 템플릿별 교양/영역 필요 학점 정의
CREATE TABLE culture_credit_rule (
    culture_credit_rule_id BIGSERIAL PRIMARY KEY,      -- 교양 규칙 PK
    template_id            BIGINT NOT NULL,            -- 소속 템플릿 FK
    rule_category          VARCHAR(6) NOT NULL,       -- 규칙 카테고리 , 교양필수/미래혁신/채플/소양
    required_credits       SMALLINT NOT NULL,          -- 필요 학점
    created_at             TIMESTAMP NOT NULL DEFAULT NOW(), -- 생성 일시

    -- template_id -> graduation_template.template_id (교양/영역 학점 규칙은 반드시 특정 졸업요건 템플릿에 속해야함.)
    CONSTRAINT fk_culture_rule_template
        FOREIGN KEY (template_id) REFERENCES graduation_template(template_id),

    CONSTRAINT uq_culture_rule_unique
        UNIQUE (template_id, rule_category)
);

-- culture_credit_rule_seed : SEED 테그 테이블
-- 교양 규칙 중 미래혁신의 경우 필수 SEED테그 표시
CREATE TABLE culture_credit_rule_seed (
    culture_credit_rule_seed_id BIGSERIAL PRIMARY KEY,      -- SEED 규칙 PK
    culture_credit_rule_id      BIGINT NOT NULL,            -- 교양 규칙 FK
    seed_name                   VARCHAR(20) NOT NULL,       -- 영역이름 , Science/Economy/Environment/Diversity
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(), -- 생성 일시

    -- culture_credit_rule_id -> culture_credit_rule.culture_credit_rule_id (SEED태그는 하나의 교양 규칙과 연결되야함.)
    CONSTRAINT fk_culture_credit_rule
        FOREIGN KEY (culture_credit_rule_id) REFERENCES culture_credit_rule(culture_credit_rule_id),

    CONSTRAINT uq_ccrs_unique
        UNIQUE (culture_credit_rule_id, seed_name)
);




-- course_master : 과목 카탈로그 테이블
-- 학교 전체 과목 마스터 데이터
CREATE TABLE course_master (
    course_master_id     BIGSERIAL PRIMARY KEY,     -- 과목 PK
    course_code          VARCHAR(50) NOT NULL,      -- 과목 코드
    course_name          VARCHAR(300) NOT NULL,     -- 과목명
    default_credits      SMALLINT NOT NULL,         -- 기본 학점
    course_category      VARCHAR(2) NOT NULL,       -- 과목 유형 , 교양/전공
    course_subcategory   VARCHAR(6) NOT NULL,       -- 영역 타입 , 교양필수/미래혁신/소양/채플/전공필수/전공탐색/전공선택
    seed_area            VARCHAR(20) NULL,          -- 영역 이름 , Science/Economy/Environment/Diversity
    opened_year          SMALLINT NOT NULL,         -- 개설 연도
    opened_term          VARCHAR(8) NOT NULL,       -- 개설 학기 , 1/여름 계절학기/2/겨울 계절학기
    opened_department_id BIGINT NOT NULL,           -- 개설 학과 FK
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(), -- 생성 일시

    -- opened_department_id -> department.department_id (과목은 반드시 특정 학부에서 개설되어야함.)
    CONSTRAINT fk_course_master_dept
        FOREIGN KEY (opened_department_id) REFERENCES department(department_id),

    CONSTRAINT uq_course_master_natural
        UNIQUE (opened_department_id, course_code, opened_year, opened_term)
);


-- course_master_major : 과목-전공 인정 매핑 테이블
-- 같은 과목이 여러 전공에서 전공선택(또는 전공필수)로 인정될 수 있음
CREATE TABLE course_master_major (
    course_master_major_id BIGSERIAL PRIMARY KEY, -- 매핑 PK
    course_master_id       BIGINT NOT NULL,       -- 과목 마스터 FK
    major_id               BIGINT NOT NULL,       -- 전공 FK
    recognition_type       VARCHAR(6) NOT NULL,   -- 전공 인정 유형 , 전공필수/전공탐색/전공선택

    -- course_master_id -> course_master.course_master_id (매핑은 특정 과목 마스터에 속해야함.)
    CONSTRAINT fk_cmm_course_master
        FOREIGN KEY (course_master_id) REFERENCES course_master(course_master_id),

    -- major_id -> major.major_id (매핑은 특정 전공에 속해야함.)
    CONSTRAINT fk_cmm_major
        FOREIGN KEY (major_id) REFERENCES major(major_id),

    CONSTRAINT uq_cmm_unique
        UNIQUE (course_master_id, major_id, recognition_type)
);


-- course : 사용자 수강 이력 테이블
-- 졸업 판정의 핵심 데이터
CREATE TABLE course (
    course_id        BIGSERIAL PRIMARY KEY,     -- 수강 기록 PK
    user_id          BIGINT NOT NULL,           -- 사용자 FK
    course_master_id BIGINT NOT NULL,           -- 과목 FK
    major_id         BIGINT NULL,               -- 학점 귀속 전공 FK
    earned_credits   SMALLINT NOT NULL,         -- 취득 학점
    grade            VARCHAR(2) NOT NULL,       -- 성적 , P/NP/A+/A0...
    taken_year       SMALLINT NOT NULL,         -- 수강 연도 , 2026
    taken_term       VARCHAR(8) NOT NULL,       -- 수강 학기 , 1/여름 계절학기/2/겨울 계절학기
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(), -- 생성 일시

    -- user_id -> users.user_id (수강 기록은 반드시 특정 사용자에 속해야함.)
    CONSTRAINT fk_course_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),

    -- course_master_id -> course_master.course_master_id (수강 기록은 반드시 특정 과목 마스터를 참조해야함.)
    CONSTRAINT fk_course_master
        FOREIGN KEY (course_master_id) REFERENCES course_master(course_master_id),

    -- major_id -> major.major_id (수강 기록은 특정 전공으로 학점 귀속될 수 있음. NULL 허용.)
    CONSTRAINT fk_course_major
        FOREIGN KEY (major_id) REFERENCES major(major_id)

    --CONSTRAINT uq_course_unique
    --    UNIQUE (user_id, course_master_id, taken_year, taken_term)
);



-- file_metadata : 파일 메타데이터 테이블
-- 실제 파일은 NAS에 저장, DB에는 정보만 저장
CREATE TABLE file_metadata (
    file_id           BIGSERIAL PRIMARY KEY, -- 파일 PK
    user_id           BIGINT NOT NULL,       -- 소유 사용자 FK
    file_category     VARCHAR(50) NOT NULL,  -- 파일 카테고리
    original_filename VARCHAR(500) NOT NULL, -- 원본 파일명
    stored_filename   VARCHAR(200) NOT NULL, -- 저장 파일명(UUID)
    stored_path       TEXT NOT NULL,         -- NAS 저장 경로
    content_type      VARCHAR(100) NOT NULL, -- MIME 타입
    size_bytes        BIGINT NOT NULL,       -- 파일 크기(byte)
    uploaded_at       TIMESTAMP NOT NULL DEFAULT NOW(), -- 업로드 일시

    -- user_id -> users.user_id (파일 메타데이터는 반드시 특정 사용자에 귀속되어야함.)
    CONSTRAINT fk_file_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),

    CONSTRAINT uq_stored_path
        UNIQUE (stored_path)
);



-- user_storage_usage : 사용자 스토리지 사용량 테이블
-- 3GB 제한 계산 및 동시성 제어 기준 테이블
CREATE TABLE user_storage_usage (
    user_id    BIGINT PRIMARY KEY,       -- 사용자 PK이자 FK
    used_bytes BIGINT NOT NULL DEFAULT 0, -- 현재 사용 중인 총 용량(byte)
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(), -- 마지막 갱신 일시

    -- user_id -> users.user_id (사용자 스토리지 사용량은 users와 1:1로 연결됨.)
    CONSTRAINT fk_storage_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
);
