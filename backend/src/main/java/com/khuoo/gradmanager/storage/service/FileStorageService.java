package com.khuoo.gradmanager.storage.service;

import com.khuoo.gradmanager.error.exception.ApiException;
import com.khuoo.gradmanager.error.exception.ErrorCode;
import com.khuoo.gradmanager.storage.config.StorageProperties;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.*;


@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(StorageProperties properties) {
        // 절대 경로로 저장
        this.root = Paths.get(properties.root())
                .normalize()
                .toAbsolutePath();
    }

    // 파일 저장
    public void save(String relativePath, MultipartFile file) {
        Path target = targetPath(relativePath);

        try {
            Files.createDirectories(target.getParent()); // 디렉토리가 없으면 생성

            // InputStream으로 파일 저장 (in.close() 자동실행)
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target); // 실제 파일을 저장 위치에 저장
            }

        } catch (Exception e) {
            // 파일 시스템 오류 발생 시 예외 변환
            throw new ApiException(ErrorCode.DEPENDENCY_FAILURE, e); // 파일 시스템 오류 발생 시 예외
        }
    }

    // 파일을 Resource 형태로 반환 (다운로드용)
    public Resource loadAsResource(String relativePath) {
        Path target = targetPath(relativePath);

        // 실제 파일을 가리키는 Resource 객체 생성 (바로 다운로드 X)
        return new FileSystemResource(target);
    }

    // 파일 존재 여부 확인
    public boolean exists(String relativePath) {
        Path target = targetPath(relativePath);

        // 경로가 실재로 있는지 확인 && 경로에서 가져올 파일이 실제 파일이 맞는지 확인
        return Files.exists(target) && Files.isRegularFile(target);
    }

    // 파일 삭제
    public void delete(String relativePath) {
        Path target = targetPath(relativePath);

        try {
            Files.deleteIfExists(target); // 파일이 있으면 삭제, 없으면 아무 일도 하지 않음
        } catch (Exception e) {
            throw new ApiException(ErrorCode.DEPENDENCY_FAILURE, e); // 파일 삭제 중 오류 발생 시 예외 변환
        }
    }

    // 최종 경로 반환
    private Path targetPath(String relativePath) {
        Path resolved = root.resolve(relativePath).normalize(); // root + relativePath 결합

        // root경로로 시작하는지 확인 (Path Traversal 방어)
        if (!resolved.startsWith(root)) { throw new ApiException(ErrorCode.INVALID_REQUEST);}

        return resolved;
    }
}
