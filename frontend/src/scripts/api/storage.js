import { buildUrl, del, get, post } from "./client.js";

// 자료함 파일 목록을 조회
export function getStorageFiles(category = "") {
  return get("/api/v1/storage/files", {
    query: category ? { category } : null,
  });
}

// 자료함 사용량 요약 정보를 조회
export function getStorageUsage() {
  return get("/api/v1/storage/usage");
}

// 자료함 파일을 multipart/form-data 형식으로 업로드
export function uploadStorageFile(category, file) {
  const formData = new FormData();
  formData.append("category", category);
  formData.append("file", file);

  return post("/api/v1/storage/files", formData);
}

// 파일 ID 기준으로 자료함 파일을 삭제
export function deleteStorageFile(fileId) {
  return del(`/api/v1/storage/files/${fileId}`);
}

// 파일 ID 기준으로 자료함 다운로드 URL을 생성
export function buildStorageDownloadUrl(fileId) {
  return buildUrl(`/api/v1/storage/files/${fileId}/download`);
}
