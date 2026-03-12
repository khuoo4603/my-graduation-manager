// 서비스 전역 사용 프로젝트명
export const SERVICE_NAME = "My Graduation Manager";

// Vite 환경변수 기반 앱 실행 환경 조회
const ENV_APP_ENV = typeof import.meta !== "undefined" ? import.meta.env?.VITE_APP_ENV : "";
const ENV_MODE = typeof import.meta !== "undefined" ? import.meta.env?.MODE : "";

function resolveAppEnv() {
  const normalized = String(ENV_APP_ENV || "").trim().toLowerCase();
  if (normalized === "local" || normalized === "dev" || normalized === "prod") return normalized;

  if (ENV_MODE === "localdev") return "local";
  if (ENV_MODE === "development") return "dev";
  return "prod";
}

// local/dev/prod 환경 상수
export const APP_ENV = resolveAppEnv();
export const isLocalEnv = APP_ENV === "local";
export const isDevEnv = APP_ENV === "dev";
export const isProdEnv = APP_ENV === "prod";

// Vite 환경변수 기반 API 베이스 URL 조회
const ENV_API_BASE_URL = typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : "";

// API 베이스 URL 끝의 슬래시를 제거해 경로 결합 시 중복을 방지
export const API_BASE_URL = (ENV_API_BASE_URL || "").replace(/\/+$/, "");

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

// 인증 관련 경로 상수
export const AUTH_PATHS = {
  GOOGLE_OAUTH_START: "/oauth2/authorization/google",
};

// API origin 기준 OAuth 시작 URL
export function getGoogleLoginUrl() {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is required");
  }

  return `${API_BASE_URL}${AUTH_PATHS.GOOGLE_OAUTH_START}`;
}

// UI 공통 안내 문구 모음
export const UI_MESSAGES = {
  READY_TITLE: "페이지 구조 준비 완료",
  READY_DESCRIPTION: "아직 준비중인 페이지입니다.",
  NOT_AUTHENTICATED: "로그인이 필요합니다",
  NETWORK_ERROR: "네트워크 연결을 확인해주세요",
  COMMON_ERROR: "요청 처리 중 오류가 발생했습니다",
};
