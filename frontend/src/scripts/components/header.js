import { logout } from "../api/auth.js";
import { PAGE_PATHS, SERVICE_NAME } from "../utils/constants.js";
import { redirectToErrorPageByError } from "../utils/error.js";
import { getFluentIconPath } from "./icon-map.js";

const HEADER_NAV_ITEMS = [
  { label: "Dashboard", href: PAGE_PATHS.GRAD, icon: "apps" },
  { label: "Courses", href: PAGE_PATHS.GRAD_COURSES, icon: "book" },
  { label: "Graduation Status", href: PAGE_PATHS.GRAD_STATUS, icon: "clipboardTask" },
  { label: "Storage", href: PAGE_PATHS.STORAGE, icon: "folder" },
  { label: "Profile", href: PAGE_PATHS.PROFILE, icon: "person" },
];

// 헤더 사용자명 출력용 텍스트 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 경로 비교용 슬래시 정규화
function normalizePath(pathname = "") {
  if (!pathname) return "/";

  const trimmedPathname = pathname.replace(/\/+$/, "");
  return trimmedPathname || "/";
}

// 현재 경로 활성 상태 판별
function isActivePath(pathname, targetPath) {
  return normalizePath(pathname) === normalizePath(targetPath);
}

// 헤더 네비게이션 항목 HTML 조립
function buildHeaderNavItemsHtml(currentPath) {
  return HEADER_NAV_ITEMS.map((item) => {
    const activeClassName = isActivePath(currentPath, item.href) ? " is-active" : "";

    return `
      <li class="app-nav__item">
        <a class="app-nav__link${activeClassName}" href="${item.href}">
          <img class="app-nav__icon" src="${getFluentIconPath(item.icon)}" alt="" aria-hidden="true" />
          <span>${item.label}</span>
        </a>
      </li>
    `;
  }).join("");
}

// 공통 헤더 HTML 조립
function buildHeaderHtml(options = {}) {
  const currentPath = options.currentPath || window.location.pathname;
  const userName = options.userName || "unknown";

  return `
    <header class="app-header">
      <div class="container app-header__inner">
        <a class="app-brand" href="${PAGE_PATHS.GRAD}">
          <span class="app-brand__mark">
            <img class="app-brand__icon" src="${getFluentIconPath("homeFilled")}" alt="" aria-hidden="true" />
          </span>
          <span class="app-brand__text">${SERVICE_NAME}</span>
        </a>

        <nav class="app-nav" aria-label="Primary">
          <ul class="app-nav__list">
            ${buildHeaderNavItemsHtml(currentPath)}
          </ul>
        </nav>

        <div class="app-user">
          <button
            class="app-user__theme"
            type="button"
            aria-label="Toggle theme"
            aria-pressed="false"
            title="Toggle light and dark mode"
            data-theme-toggle
          >
            <img
              class="app-user__icon"
              src="${getFluentIconPath("weatherMoon")}"
              alt=""
              aria-hidden="true"
              data-theme-icon
            />
          </button>
          <span class="app-user__avatar">
            <img class="app-user__icon" src="${getFluentIconPath("person")}" alt="" aria-hidden="true" />
          </span>
          <span class="app-user__name">${escapeHtml(userName)}</span>
          <button class="app-user__logout" type="button" aria-label="Logout" data-logout-action>
            <img class="app-user__icon" src="${getFluentIconPath("signOut")}" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  `;
}

// 헤더 내부 DOM 요소 수집
function collectHeaderElements(host) {
  return {
    themeToggle: host.querySelector("[data-theme-toggle]"),
    themeIcon: host.querySelector("[data-theme-icon]"),
    logoutButton: host.querySelector("[data-logout-action]"),
  };
}

// 헤더 테마 토글 처리
function handleThemeToggle(elements) {
  if (!elements.themeToggle || !elements.themeIcon) return;

  const isLightMode = elements.themeToggle.getAttribute("aria-pressed") === "true";
  if (isLightMode) {
    elements.themeToggle.setAttribute("aria-pressed", "false");
    elements.themeIcon.setAttribute("src", getFluentIconPath("weatherMoon"));
    return;
  }

  elements.themeToggle.setAttribute("aria-pressed", "true");
  elements.themeIcon.setAttribute("src", getFluentIconPath("weatherSunny"));
}

// 헤더 로그아웃 처리
async function handleHeaderLogout() {
  try {
    await logout();
    window.location.href = PAGE_PATHS.HOME;
  } catch (error) {
    redirectToErrorPageByError(error, "로그아웃 처리 중 오류가 발생했습니다.");
  }
}

// 헤더 이벤트 등록
function bindHeaderEvents(elements) {
  elements.themeToggle?.addEventListener("click", () => {
    handleThemeToggle(elements);
  });

  elements.logoutButton?.addEventListener("click", handleHeaderLogout);
}

// 공통 헤더 렌더링
export function renderHeader(target, options = {}) {
  const host = target instanceof Element ? target : typeof target === "string" ? document.querySelector(target) : null;
  if (!host) return null;

  host.innerHTML = buildHeaderHtml(options);

  const elements = collectHeaderElements(host);
  bindHeaderEvents(elements);
  return host;
}
