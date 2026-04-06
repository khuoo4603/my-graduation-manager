import { get } from "./client.js";

// 졸업 판정 요약 상태를 조회
export function getGraduationStatus() {
  return get("/api/v1/grad/status");
}

// 마이크로전공 이수 현황을 조회
export function getMicroMajorStatus() {
  return get("/api/v1/micro-majors/status");
}

// 성적 요약 대시보드 데이터를 조회
export function getGradeSummary() {
  return get("/api/v1/grades/summary");
}

