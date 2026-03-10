// 서비스 전역 사용 프로젝트명
export const SERVICE_NAME = "My Graduation Manager";

// Vite 환경변수 기반 API 베이스 URL 조회
const ENV_API_BASE_URL =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : "";

// API 베이스 URL 끝의 슬래시를 제거해 경로 결합 시 중복을 방지
export const API_BASE_URL = (ENV_API_BASE_URL || "https://api.khuoo.synology.me").replace(/\/+$/, "");

// MPA 라우팅 사용 경로 상수 모음
export const PAGE_PATHS = {
  HOME: "/",
  GRAD: "/grad/",
  GRAD_COURSES: "/grad/courses/",
  GRAD_STATUS: "/grad/status/",
  STORAGE: "/storage/",
  PROFILE: "/profile/",
  ERROR: "/error/",
};

// UI 공통 안내 문구 모음
export const UI_MESSAGES = {
  READY_TITLE: "페이지 구조 준비 완료",
  READY_DESCRIPTION: "이 페이지는 다음 단계 기능 연동을 위해 준비되어 있습니다.",
  NOT_AUTHENTICATED: "인증이 필요합니다.",
};


