export const SERVICE_NAME = "My Graduation Manager";

const ENV_APP_ENV = typeof import.meta !== "undefined" ? import.meta.env?.VITE_APP_ENV : "";
const ENV_MODE = typeof import.meta !== "undefined" ? import.meta.env?.MODE : "";
const ENV_API_BASE_URL = typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : "";

// 실행 환경 값 정규화
function resolveAppEnv() {
  const normalizedAppEnv = String(ENV_APP_ENV || "")
    .trim()
    .toLowerCase();

  if (normalizedAppEnv === "local" || normalizedAppEnv === "dev" || normalizedAppEnv === "prod") {
    return normalizedAppEnv;
  }

  if (ENV_MODE === "localdev") return "local";
  if (ENV_MODE === "development") return "dev";
  return "prod";
}

export const APP_ENV = resolveAppEnv();
export const isLocalEnv = APP_ENV === "local";
export const isDevEnv = APP_ENV === "dev";
export const isProdEnv = APP_ENV === "prod";

export const API_BASE_URL = (ENV_API_BASE_URL || "").replace(/\/+$/, "");

export const PAGE_PATHS = {
  HOME: "/",
  GRAD: "/grad/",
  GRAD_COURSES: "/grad/courses/",
  GRAD_STATUS: "/grad/status/",
  STORAGE: "/storage/",
  PROFILE: "/profile/",
  ERROR: "/error/",
};

export const UI_MESSAGES = {
  READY_TITLE: "페이지 구조 준비 완료",
  READY_DESCRIPTION: "아직 준비 중인 페이지입니다.",
  NOT_AUTHENTICATED: "로그인이 필요합니다.",
  NETWORK_ERROR: "네트워크 연결을 확인해 주세요.",
  COMMON_ERROR: "요청 처리 중 오류가 발생했습니다.",
};
