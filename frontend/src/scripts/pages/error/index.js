import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/error.css";

import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { PAGE_PATHS, UI_MESSAGES } from "/src/scripts/utils/constants.js";
import { qs } from "/src/scripts/utils/dom.js";
import { getErrorPageState } from "/src/scripts/utils/error.js";

// 에러 코드별 제목 결정
function resolveErrorTitle(code) {
  if (code === "401") return "로그인이 필요합니다";
  if (code === "403") return "접근 권한이 없습니다";
  if (code === "404") return "페이지를 찾을 수 없습니다";
  if (code === "500") return "서버 오류가 발생했습니다";
  if (code === "NETWORK") return "네트워크 오류가 발생했습니다";
  return "문제가 발생했습니다";
}

// 에러 코드별 메시지 결정
function resolveErrorMessage(code, message) {
  if (message) return message;
  if (code === "401") return UI_MESSAGES.NOT_AUTHENTICATED;
  if (code === "404") {
    return "요청하신 페이지를 찾을 수 없습니다. 페이지가 이동되었거나 더 이상 존재하지 않을 수 있습니다.";
  }
  if (code === "NETWORK") return UI_MESSAGES.NETWORK_ERROR;
  return UI_MESSAGES.COMMON_ERROR;
}

// 에러 페이지 표시 데이터 생성
function buildErrorPageData() {
  const { code, message } = getErrorPageState();
  const resolvedCode = code || "404";
  const isUnauthorized = resolvedCode === "401";

  return {
    code: resolvedCode,
    title: resolveErrorTitle(resolvedCode),
    message: resolveErrorMessage(code, message),
    isUnauthorized,
    primaryLabel: isUnauthorized ? "로그인으로 이동" : "대시보드로 이동",
    primaryIconPath: getFluentIconPath(isUnauthorized ? "person" : "home"),
  };
}

// 에러 페이지 레이아웃 렌더링
function renderErrorPage(pageRoot, errorPageData) {
  pageRoot.innerHTML = `
    <section class="error-layout">
      <article class="error-panel">
        <span class="error-panel__icon-wrap" aria-hidden="true">
          <img class="page-icon" src="${getFluentIconPath("warning")}" alt="" />
        </span>
        <p class="error-panel__code">${errorPageData.code}</p>
        <h1 class="error-panel__title">${errorPageData.title}</h1>
        <p class="error-panel__message">${errorPageData.message}</p>
        <div class="error-panel__actions">
          <button class="btn btn--primary" type="button" data-error-primary>
            <img class="btn__icon-image" src="${errorPageData.primaryIconPath}" alt="" aria-hidden="true" />
            <span>${errorPageData.primaryLabel}</span>
          </button>
          ${
            errorPageData.isUnauthorized
              ? ""
              : '<button class="btn btn--secondary" type="button" data-error-secondary>돌아가기</button>'
          }
        </div>
      </article>
    </section>
  `;
}

// 에러 페이지 DOM 요소 수집
function collectErrorElements(pageRoot) {
  return {
    primaryButton: qs("[data-error-primary]", pageRoot),
    secondaryButton: qs("[data-error-secondary]", pageRoot),
  };
}

// 이전 페이지 이동 처리
function handleErrorSecondaryAction(errorPageData) {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = errorPageData.isUnauthorized ? PAGE_PATHS.HOME : PAGE_PATHS.GRAD;
}

// 에러 페이지 이벤트 등록
function bindErrorPageEvents(elements, errorPageData) {
  elements.primaryButton?.addEventListener("click", () => {
    window.location.href = errorPageData.isUnauthorized ? PAGE_PATHS.HOME : PAGE_PATHS.GRAD;
  });

  elements.secondaryButton?.addEventListener("click", () => {
    handleErrorSecondaryAction(errorPageData);
  });
}

// 에러 페이지 초기 진입 처리
export function initErrorPage() {
  const headerRoot = qs("[data-header-root]");
  headerRoot?.replaceChildren();

  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  const errorPageData = buildErrorPageData();
  renderErrorPage(pageRoot, errorPageData);

  const elements = collectErrorElements(pageRoot);
  bindErrorPageEvents(elements, errorPageData);
}

initErrorPage();
