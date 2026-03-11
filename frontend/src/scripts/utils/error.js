import { ApiError } from "../api/client.js";
import { PAGE_PATHS, UI_MESSAGES } from "./constants.js";

// 에러 페이지 query string URL 생성
export function buildErrorPageUrl({ code, message }) {
  const params = new URLSearchParams();

  if (code !== undefined && code !== null && String(code).trim() !== "") {
    params.set("code", String(code));
  }

  if (message !== undefined && message !== null && String(message).trim() !== "") {
    params.set("message", String(message));
  }

  const queryString = params.toString();
  return queryString ? `${PAGE_PATHS.ERROR}?${queryString}` : PAGE_PATHS.ERROR;
}

// 공통 에러 페이지 이동
export function redirectToErrorPage({ code, message }) {
  window.location.href = buildErrorPageUrl({ code, message });
}

// 응답/네트워크 오류를 표시용 코드/메시지로 정규화
export function resolveErrorInfo(error, fallbackMessage = UI_MESSAGES.COMMON_ERROR) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return { code: 401, message: UI_MESSAGES.NOT_AUTHENTICATED };
    }

    if (error.code === "NETWORK_ERROR" || error.status === 0) {
      return { code: "NETWORK", message: UI_MESSAGES.NETWORK_ERROR };
    }

    return {
      code: error.status || error.code || "ERROR",
      message: error.message || fallbackMessage,
    };
  }

  if (error instanceof Error && error.message) {
    return { code: "ERROR", message: error.message };
  }

  return { code: "ERROR", message: fallbackMessage };
}

// 예외 객체를 공통 에러 페이지로 전달
export function redirectToErrorPageByError(error, fallbackMessage) {
  redirectToErrorPage(resolveErrorInfo(error, fallbackMessage));
}

// 현재 URL query string에서 에러 코드/메시지 조회
export function getErrorPageState(search = window.location.search) {
  const params = new URLSearchParams(search);
  const code = params.get("code") || "";
  const message = params.get("message") || "";

  return { code, message };
}
