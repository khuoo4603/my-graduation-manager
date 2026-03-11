import { get } from "./client.js";

// 학과 목록(참조 데이터)을 조회
export function getDepartments() {
  return get("/api/v1/reference/departments");
}

// 학과 기준 전공 목록을 조회
export function getMajors(departmentId) {
  return get("/api/v1/reference/majors", {
    query: { departmentId },
  });
}

// 학과 기준 템플릿 목록을 조회
export function getTemplates(departmentId) {
  return get("/api/v1/reference/templates", {
    query: { departmentId },
  });
}

