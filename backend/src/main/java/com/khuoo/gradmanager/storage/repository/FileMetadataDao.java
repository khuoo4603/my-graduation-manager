package com.khuoo.gradmanager.storage.repository;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
@RequiredArgsConstructor
public class FileMetadataDao implements FileMetadataRepository {

    private final JdbcTemplate jdbcTemplate;

    // 메타데이터 단건 조회. (fileId 기준)
    @Override
    public Optional<FileMetadataRow> findById(long fileId) {
        String sql = """
                SELECT file_id, user_id, file_category, original_filename, stored_filename, stored_path,
                       content_type, size_bytes, uploaded_at
                FROM file_metadata
                WHERE file_id = ?
                """;

        List<FileMetadataRow> rows = jdbcTemplate.query(sql, (rs, rn) -> new FileMetadataRow(
                rs.getLong("file_id"),
                rs.getLong("user_id"),
                rs.getString("file_category"),
                rs.getString("original_filename"),
                rs.getString("stored_filename"),
                rs.getString("stored_path"),
                rs.getString("content_type"),
                rs.getLong("size_bytes"),
                rs.getTimestamp("uploaded_at").toInstant()
        ), fileId);

        return rows.stream().findFirst();
    }

    // 메타데이터 조회 (userId 기준) / categoryOrNull -> 선택
    @Override
    public List<FileMetadataRow> findAllByUserId(long userId, String categoryOrNull) {
        if (categoryOrNull == null) {
            String sql = """
                    SELECT file_id, user_id, file_category, original_filename, stored_filename, stored_path,
                           content_type, size_bytes, uploaded_at
                    FROM file_metadata
                    WHERE user_id = ?
                    ORDER BY uploaded_at DESC, file_id DESC
                    """;
            return jdbcTemplate.query(sql, (rs, rn) -> new FileMetadataRow(
                    rs.getLong("file_id"),
                    rs.getLong("user_id"),
                    rs.getString("file_category"),
                    rs.getString("original_filename"),
                    rs.getString("stored_filename"),
                    rs.getString("stored_path"),
                    rs.getString("content_type"),
                    rs.getLong("size_bytes"),
                    rs.getTimestamp("uploaded_at").toInstant()
            ), userId);
        }

        String sql = """
                SELECT file_id, user_id, file_category, original_filename, stored_filename, stored_path,
                       content_type, size_bytes, uploaded_at
                FROM file_metadata
                WHERE user_id = ? AND file_category = ?
                ORDER BY uploaded_at DESC, file_id DESC
                """;
        return jdbcTemplate.query(sql, (rs, rn) -> new FileMetadataRow(
                rs.getLong("file_id"),
                rs.getLong("user_id"),
                rs.getString("file_category"),
                rs.getString("original_filename"),
                rs.getString("stored_filename"),
                rs.getString("stored_path"),
                rs.getString("content_type"),
                rs.getLong("size_bytes"),
                rs.getTimestamp("uploaded_at").toInstant()
        ), userId, categoryOrNull);
    }

    // 동일 사용자 기준 동일 파일명 존재 여부
    @Override
    public boolean duplicateFilename(long userId, String originalFilename) {

        String sql = """
        SELECT EXISTS (
            SELECT 1
            FROM file_metadata
            WHERE user_id = ? AND original_filename = ?
        )
        """;

        return jdbcTemplate.queryForObject(
                sql,
                Boolean.class,
                userId,
                originalFilename
        );
    }

    // 파일 메타데이터 저장
    @Override
    public long insert(FileMetadataInsert insert) {

        // PostgreSQL은 RETURNING으로 PK를 확정적으로 반환받는다(KeyHolder 사용하지 않음).
        String sql = """
                INSERT INTO file_metadata(
                    user_id,
                    file_category,
                    original_filename,
                    stored_filename,
                    stored_path,
                    content_type,
                    size_bytes,
                    uploaded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING file_id
                """;

        Long fileId = jdbcTemplate.queryForObject(
                sql,
                Long.class,
                insert.userId(),
                insert.category(),
                insert.originalFilename(),
                insert.storedFilename(),
                insert.storedPath(),
                insert.contentType(),
                insert.sizeBytes(),
                java.sql.Timestamp.from(insert.uploadedAt())
        );

        // PK를 반환받지 못한 경우 내부 오류로 처리한다(정상 케이스에서는 발생하지 않음).
        if (fileId == null) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR);
        }

        return fileId;
    }

    // 메타데이터 삭제
    @Override
    public int deleteById(long fileId) {
        String sql = "DELETE FROM file_metadata WHERE file_id = ?";
        return jdbcTemplate.update(sql, fileId);
    }
}