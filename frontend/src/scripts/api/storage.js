import { del, get, post } from "./client.js";

// 자료함 파일 목록을 조회
export function getStorageFiles() {
  return get("/api/v1/storage/files");
}

// 자료함 사용량 요약 정보를 조회
export function getStorageUsage() {
  return get("/api/v1/storage/usage");
}

// 파일 또는 FormData를 업로드 API 형식으로 맞춰 전송
export function uploadFile(fileOrFormData) {
  const formData = fileOrFormData instanceof FormData ? fileOrFormData : new FormData();
  if (!(fileOrFormData instanceof FormData) && fileOrFormData) {
    formData.append("file", fileOrFormData);
  }

  return post("/api/v1/storage/files", formData);
}

// 파일 ID 기준으로 자료함 파일을 삭제
export function deleteStorageFile(fileId) {
  return del(`/api/v1/storage/files/${fileId}`);
}

// 파일 ID 기준으로 자료함 파일을 다운로드
export function downloadStorageFile(fileId) {
  return get(`/api/v1/storage/files/${fileId}/download`, {
    responseType: "blob",
  });
}
