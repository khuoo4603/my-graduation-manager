package com.khuoo.gradmanager.storage.controller;

import com.khuoo.gradmanager.security.principal.CurrentUser;
import com.khuoo.gradmanager.storage.dto.FileListResponse;
import com.khuoo.gradmanager.storage.dto.StorageUsageResponse;
import com.khuoo.gradmanager.storage.dto.UploadResponse;
import com.khuoo.gradmanager.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/storage")
public class StorageController {

    private final CurrentUser currentUser;
    private final StorageService storageService;

    // 파일 업로드
    @PostMapping(value = "/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadResponse upload(
            @RequestParam("category") String category, // 카테고리 5개 허용("GRAD_REQUIREMENTS", "GRAD_SUBMISSIONS", "PROJECT", "PORTFOLIO", "CLASS_MATERIALS")
            @RequestPart("file") MultipartFile file
    ) {
        return storageService.upload(currentUser.userId(), category, file);
    }


    // 유저 파일 조회
    @GetMapping("/files")
    public FileListResponse list(@RequestParam(value = "category", required = false) String category) {
        return storageService.list(currentUser.userId(), category);
    }

    // 파일 다운로드
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable("fileId") long fileId) {
        StorageService.DownloadResult result = storageService.Download(currentUser.userId(), fileId);

        // 응답 헤더 데이터
        String encode = URLEncoder.encode(result.originalFilename(), StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        String filename = "filename*=UTF-8''" + encode;
        String contentDisposition = "attachment; " + filename; // attachment로 고정 = 이미지 미리보기, 파일 실행 금지 -> 무조건 다운로드만

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .header(HttpHeaders.CONTENT_TYPE, result.contentType())
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(result.sizeBytes()))
                .body(result.resource());
    }

    // 파일 삭제
    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> delete(@PathVariable("fileId") long fileId) {
        storageService.delete(currentUser.userId(), fileId);
        return ResponseEntity.noContent().build();
    }

    // storage 사용량 조회
    @GetMapping("/usage")
    public StorageUsageResponse usage() {
        return storageService.usage(currentUser.userId());
    }
}