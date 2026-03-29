import { del, get, patch, post } from "./client.js";

// 과목 마스터 데이터 목록 조회
export function getCourseMasters(params = {}) {
  return get("/api/v1/course-masters", {
    query: params,
  });
}

// 현재 사용자의 수강 과목 목록 조회
export function getCourses(params = {}) {
  return get("/api/v1/courses", {
    query: params,
  });
}

// 수강 과목 등록
export function addCourse(payload) {
  return post("/api/v1/courses", payload);
}

// 수강 과목 부분 수정
export function patchCourse(id, payload) {
  return patch(`/api/v1/courses/${id}`, payload);
}

// 수강 과목 삭제
export function deleteCourse(id) {
  return del(`/api/v1/courses/${id}`);
}
