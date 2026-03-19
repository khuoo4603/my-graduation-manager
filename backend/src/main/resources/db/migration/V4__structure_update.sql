-- 1) users 테이블 변경
-- 최초 사용자 생성 시 학부 미설정 상태를 정상으로 허용
ALTER TABLE users
    ALTER COLUMN department_id DROP NOT NULL;


-- 2) course_master 테이블 확장
-- default course master 도입을 위해 기존 학기 체크 제약 제거
ALTER TABLE course_master
    DROP CONSTRAINT chk__course_master__opened_term;

-- default 과목 fallback용 컬럼 추가
ALTER TABLE course_master
    ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE, -- default과목 여부
    ADD COLUMN valid_from_year SMALLINT NULL,             -- 적용 시작 년도
    ADD COLUMN valid_to_year SMALLINT NULL;               -- 적용 종료 년도

-- default 과목은 특정 개설 연도/학기에 묶이지 않을 수 있으므로 null 허용
ALTER TABLE course_master
    ALTER COLUMN opened_year DROP NOT NULL,
    ALTER COLUMN opened_term DROP NOT NULL;


-- 3) course 테이블 확장
-- 재수강 연결과 수정 시각 추적을 위해 course 확장
ALTER TABLE course
    DROP CONSTRAINT chk__course__taken_term;

ALTER TABLE course
    ADD COLUMN retake_course_id BIGINT NULL,                -- 재수강 대상 과목 스코프
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW(); -- 수정 시간


-- 4) 기존 학기 데이터 표준값으로 변환
-- 기존 계절학기 한글 값을 새 표준값으로 변환
UPDATE course_master
SET opened_term = CASE opened_term
                      WHEN '여름 계절학기' THEN 'SUMMER'
                      WHEN '겨울 계절학기' THEN 'WINTER'
                      ELSE opened_term
    END
WHERE opened_term IN ('여름 계절학기', '겨울 계절학기');

UPDATE course
SET taken_term = CASE taken_term
                     WHEN '여름 계절학기' THEN 'SUMMER'
                     WHEN '겨울 계절학기' THEN 'WINTER'
                     ELSE taken_term
    END
WHERE taken_term IN ('여름 계절학기', '겨울 계절학기');


-- 5) 학기 저장값 체크 적용
-- 학기 저장값을 1/SUMMER/2/WINTER 기준으로 통일
ALTER TABLE course_master
    ADD CONSTRAINT chk__course_master__opened_term
        CHECK (opened_term IS NULL OR opened_term IN ('1', 'SUMMER', '2', 'WINTER'));

ALTER TABLE course
    ADD CONSTRAINT chk__course__taken_term
        CHECK (taken_term IN ('1', 'SUMMER', '2', 'WINTER'));


-- 6) 중복 데이터 사전 점검
-- unique 제약 추가 전에 동일 수강이력 중복 데이터가 있는지 확인
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM course
        GROUP BY user_id, course_master_id, taken_year, taken_term
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot add uq__course__user_id__course_master_id__taken_year__taken_term because duplicate course rows already exist.';
END IF;
END
$$;


-- 7) FK / UNIQUE / INDEX 추가
-- 재수강 참조 관계와 중복 방지 제약 추가
ALTER TABLE course
    ADD CONSTRAINT fk__course__retake_course_id
        FOREIGN KEY (retake_course_id) REFERENCES course(course_id)
            ON DELETE SET NULL;

ALTER TABLE course
    ADD CONSTRAINT uq__course__user_id__course_master_id__taken_year__taken_term
        UNIQUE (user_id, course_master_id, taken_year, taken_term);

CREATE INDEX IF NOT EXISTS idx__course__retake_course_id
    ON course(retake_course_id);