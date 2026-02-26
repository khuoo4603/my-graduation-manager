-- 사용자별/카테고리별 동일 파일명 업로드를 허용하지 않음
ALTER TABLE file_metadata
    ADD CONSTRAINT uq__file_metadata__user_category_original
        UNIQUE (user_id, original_filename);