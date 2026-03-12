import { ApiError } from "../api/client.js";
import { getProfile } from "../api/profile.js";
import { UI_MESSAGES, isLocalEnv } from "./constants.js";
import { redirectToErrorPage, redirectToErrorPageByError } from "./error.js";

// local 보호 페이지 진입 허용 결과
function getLocalAuthResult() {
  return {
    isAuthenticated: true,
    profile: null,
    status: 200,
  };
}

// 현재 로그인 상태를 서버 프로필 API로 확인
export async function checkAuthStatus() {
  // local 개발 모드 분기
  if (isLocalEnv) {
    return getLocalAuthResult();
  }

  try {
    const profile = await getProfile();
    return {
      isAuthenticated: true,
      profile,
      status: 200,
    };
  } catch (error) {
    // 401 응답은 미인증 상태로 처리
    if (error instanceof ApiError && error.status === 401) {
      return {
        isAuthenticated: false,
        profile: null,
        status: 401,
      };
    }

    throw error;
  }
}

// 인증이 필요한 페이지 공통 인증 검사
export async function requireAuthenticated(options = {}) {
  const authResult = await checkAuthStatus();

  // 미인증일 때 선택 콜백 실행
  if (!authResult.isAuthenticated && typeof options.onUnauthorized === "function") {
    options.onUnauthorized(authResult);
  }

  return authResult;
}

// 보호 페이지 초기 진입 세션 확인
export async function ensureProtectedPageAccess() {
  // local에서는 에러 리다이렉트 생략
  if (isLocalEnv) {
    return getLocalAuthResult();
  }

  try {
    const authResult = await requireAuthenticated();
    if (authResult.isAuthenticated) return authResult;

    redirectToErrorPage({
      code: 401,
      message: UI_MESSAGES.NOT_AUTHENTICATED,
    });
    return null;
  } catch (error) {
    redirectToErrorPageByError(error, UI_MESSAGES.COMMON_ERROR);
    return null;
  }
}
