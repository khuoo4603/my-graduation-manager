import { get } from "./client.js";

// 졸업 판정 요약 상태를 조회
export function getGraduationStatus() {
  return get("/api/v1/grad/status");
}

