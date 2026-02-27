package com.khuoo.gradmanager.storage.dto;

import java.util.List;


// 파일 목록 조회 응답 DTO
public record FileListResponse(
        List<FileItemResponse> items
) {}