import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/error.css";

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { qs } from "/src/scripts/utils/dom.js";
import { PAGE_PATHS, UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { getErrorPageState } from "/src/scripts/utils/error.js";

// 코드 기준 제목 매핑
function resolveErrorTitle(code) {
  if (code === "401") return "Unauthorized";
  if (code === "403") return "Forbidden";
  if (code === "404") return "Page Not Found";
  if (code === "500") return "Server Error";
  if (code === "NETWORK") return "Network Error";
  return "Something Went Wrong";
}

// 코드 기준 기본 메시지 매핑
function resolveErrorMessage(code, message) {
  if (message) return message;
  if (code === "401") return UI_MESSAGES.NOT_AUTHENTICATED;
  if (code === "404")
    return "Sorry, we couldn't find the page you're looking for. The page might have been moved or doesn't exist.";
  if (code === "NETWORK") return UI_MESSAGES.NETWORK_ERROR;
  return UI_MESSAGES.COMMON_ERROR;
}

// Error 페이지 초기화
export function initErrorPage() {
  // 에러 페이지는 헤더 비노출
  const headerRoot = qs("[data-header-root]");
  if (headerRoot) {
    headerRoot.replaceChildren();
  }

  // 렌더링 대상 루트 확인
  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const { code, message } = getErrorPageState();
  const safeCode = code || "404";
  const safeTitle = resolveErrorTitle(safeCode);
  const safeMessage = resolveErrorMessage(code, message);
  const isUnauthorized = safeCode === "401";
  const primaryLabel = isUnauthorized ? "Go to Login" : "Go to Dashboard";
  const primaryIcon = getFluentIconPath(isUnauthorized ? "person" : "home");

  // 코드/메시지 중심 에러 안내 블록 렌더링
  pageRoot.innerHTML = `
    <section class="error-layout">
      <article class="error-panel">
        <span class="error-panel__icon-wrap" aria-hidden="true">
          <img class="page-icon" src="${getFluentIconPath("warning")}" alt="" />
        </span>
        <p class="error-panel__code" data-error-code></p>
        <h1 class="error-panel__title" data-error-title></h1>
        <p class="error-panel__message" data-error-message></p>
        <div class="error-panel__actions">
          <button class="btn btn--primary" type="button" data-error-primary>
            <img class="btn__icon-image" src="${primaryIcon}" alt="" aria-hidden="true" />
            <span>${primaryLabel}</span>
          </button>
          <button class="btn btn--secondary" type="button" data-error-secondary>Go Back</button>
        </div>
      </article>
    </section>
  `;

  const codeNode = qs("[data-error-code]", pageRoot);
  const titleNode = qs("[data-error-title]", pageRoot);
  const messageNode = qs("[data-error-message]", pageRoot);
  const primaryButton = qs("[data-error-primary]", pageRoot);
  const secondaryButton = qs("[data-error-secondary]", pageRoot);

  if (codeNode) codeNode.textContent = safeCode;
  if (titleNode) titleNode.textContent = safeTitle;
  if (messageNode) messageNode.textContent = safeMessage;

  // 401은 로그인 페이지, 그 외는 대시보드 이동
  primaryButton?.addEventListener("click", () => {
    if (isUnauthorized) {
      window.location.href = PAGE_PATHS.HOME;
      return;
    }

    window.location.href = PAGE_PATHS.GRAD;
  });

  // 이전 페이지 이동
  secondaryButton?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = isUnauthorized ? PAGE_PATHS.HOME : PAGE_PATHS.GRAD;
  });
}

// 엔트리 로드 시 에러 페이지 초기화
initErrorPage();
