import { del, get, post } from "./client.js";

// 과목 마스터 데이터 목록을 조회
export function getCourseMasters(params = {}) {
  return get("/api/v1/course-masters", {
    query: params,
  });
}

// 현재 사용자의 수강 과목 목록을 조회
export function getCourses() {
  return get("/api/v1/courses");
}

// 수강 과목을 추가
export function addCourse(payload) {
  return post("/api/v1/courses", payload);
}

// 지정한 수강 과목을 삭제
export function deleteCourse(id) {
  return del(`/api/v1/courses/${id}`);
}

