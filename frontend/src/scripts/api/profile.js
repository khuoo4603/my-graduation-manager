import { del, get, post, put } from "./client.js";

// 내 프로필 정보를 조회
export function getProfile() {
  return get("/api/v1/profile");
}

// 소속 학과를 변경
export function updateDepartment(departmentId) {
  return put("/api/v1/profile/department", { departmentId });
}

// 졸업 요건 템플릿을 변경
export function updateTemplate(templateId) {
  return put("/api/v1/profile/template", { templateId });
}

// 전공 정보를 추가
export function addMajor({ majorId, majorType }) {
  return post("/api/v1/profile/major", { majorId, majorType });
}

// 등록된 전공 정보를 삭제
export function deleteMajor(userMajorId) {
  return del(`/api/v1/profile/major/${userMajorId}`);
}

