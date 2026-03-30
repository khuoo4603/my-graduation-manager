import { logout } from "../api/auth.js";
import { PAGE_PATHS, SERVICE_NAME } from "../utils/constants.js";
import { redirectToErrorPageByError } from "../utils/error.js";
import { getFluentIconPath } from "./icon-map.js";

// 헤더 사용자명 출력용 특수문자 이스케이프
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 현재 경로 비교용 정규화
function normalizePath(pathname = "") {
  if (!pathname) return "/";
  const trimmedPathname = pathname.replace(/\/+$/, "");
  return trimmedPathname || "/";
}

// 네비게이션 active 상태 판단
function isActivePath(pathname, targetPath) {
  return normalizePath(pathname) === normalizePath(targetPath);
}

// 헤더 이벤트 대상 요소 수집
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

// 헤더 버튼 이벤트 바인딩
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

  const currentPath = options.currentPath || window.location.pathname;
  const userName = options.userName || "unknown";
  const dashboardActive = isActivePath(currentPath, PAGE_PATHS.GRAD) ? " is-active" : "";
  const coursesActive = isActivePath(currentPath, PAGE_PATHS.GRAD_COURSES) ? " is-active" : "";
  const statusActive = isActivePath(currentPath, PAGE_PATHS.GRAD_STATUS) ? " is-active" : "";
  const storageActive = isActivePath(currentPath, PAGE_PATHS.STORAGE) ? " is-active" : "";
  const profileActive = isActivePath(currentPath, PAGE_PATHS.PROFILE) ? " is-active" : "";

  host.innerHTML = `
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
            <li class="app-nav__item">
              <a class="app-nav__link${dashboardActive}" href="${PAGE_PATHS.GRAD}">
                <img class="app-nav__icon" src="${getFluentIconPath("apps")}" alt="" aria-hidden="true" />
                <span>Dashboard</span>
              </a>
            </li>
            <li class="app-nav__item">
              <a class="app-nav__link${coursesActive}" href="${PAGE_PATHS.GRAD_COURSES}">
                <img class="app-nav__icon" src="${getFluentIconPath("book")}" alt="" aria-hidden="true" />
                <span>Courses</span>
              </a>
            </li>
            <li class="app-nav__item">
              <a class="app-nav__link${statusActive}" href="${PAGE_PATHS.GRAD_STATUS}">
                <img class="app-nav__icon" src="${getFluentIconPath("clipboardTask")}" alt="" aria-hidden="true" />
                <span>Graduation Status</span>
              </a>
            </li>
            <li class="app-nav__item">
              <a class="app-nav__link${storageActive}" href="${PAGE_PATHS.STORAGE}">
                <img class="app-nav__icon" src="${getFluentIconPath("folder")}" alt="" aria-hidden="true" />
                <span>Storage</span>
              </a>
            </li>
            <li class="app-nav__item">
              <a class="app-nav__link${profileActive}" href="${PAGE_PATHS.PROFILE}">
                <img class="app-nav__icon" src="${getFluentIconPath("person")}" alt="" aria-hidden="true" />
                <span>Profile</span>
              </a>
            </li>
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

  const elements = collectHeaderElements(host);
  bindHeaderEvents(elements);
  return host;
}
