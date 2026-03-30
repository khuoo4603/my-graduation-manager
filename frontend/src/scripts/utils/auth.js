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

// 보호 페이지 초기 진입 인증 확인
export async function ensureProtectedPageAccess() {
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
    if (error instanceof ApiError && error.status === 401) {
      redirectToErrorPage({
        code: 401,
        message: UI_MESSAGES.NOT_AUTHENTICATED,
      });
      return null;
    }

    redirectToErrorPageByError(error, UI_MESSAGES.COMMON_ERROR);
    return null;
  }
}
