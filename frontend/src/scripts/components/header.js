import { logout } from "../api/auth.js";
import { PAGE_PATHS, SERVICE_NAME } from "../utils/constants.js";
import { resolveElement } from "../utils/dom.js";
import { redirectToErrorPageByError } from "../utils/error.js";
import { getFluentIconPath } from "./icon-map.js";

// 경로 비교 전 슬래시 형태 통일
function normalizePath(pathname = "") {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

// 현재 경로와 대상 경로 일치 여부
function isActivePath(pathname, targetPath) {
  return normalizePath(pathname) === normalizePath(targetPath);
}

// 상단 네비게이션 항목 HTML 생성
function buildNavItemsHtml(currentPath) {
  const navItems = [
    { label: "Dashboard", href: PAGE_PATHS.GRAD, icon: "apps" },
    { label: "Courses", href: PAGE_PATHS.GRAD_COURSES, icon: "book" },
    { label: "Graduation Status", href: PAGE_PATHS.GRAD_STATUS, icon: "clipboardTask" },
    { label: "Storage", href: PAGE_PATHS.STORAGE, icon: "folder" },
    { label: "Profile", href: PAGE_PATHS.PROFILE, icon: "person" },
  ];

  return navItems
    .map((item) => {
      const activeClass = isActivePath(currentPath, item.href) ? " is-active" : "";
      return `
        <li class="app-nav__item">
          <a class="app-nav__link${activeClass}" href="${item.href}">
            <img class="app-nav__icon" src="${getFluentIconPath(item.icon)}" alt="" aria-hidden="true" />
            <span>${item.label}</span>
          </a>
        </li>
      `;
    })
    .join("");
}

// 테마 토글 이벤트 바인딩
function bindThemeToggle(header) {
  const themeToggle = header.querySelector("[data-theme-toggle]");
  const themeIcon = header.querySelector("[data-theme-icon]");
  if (!themeToggle || !themeIcon) return;

  themeToggle.addEventListener("click", () => {
    const isLightMode = themeToggle.getAttribute("aria-pressed") === "true";
    if (isLightMode) {
      themeToggle.setAttribute("aria-pressed", "false");
      themeIcon.setAttribute("src", getFluentIconPath("weatherMoon"));
      return;
    }

    themeToggle.setAttribute("aria-pressed", "true");
    themeIcon.setAttribute("src", getFluentIconPath("weatherSunny"));
  });
}

// 로그아웃 버튼 이벤트 바인딩
function bindLogoutAction(header) {
  const logoutButton = header.querySelector("[data-logout-action]");
  if (!logoutButton) return;

  logoutButton.addEventListener("click", async () => {
    try {
      await logout();
      window.location.href = PAGE_PATHS.HOME;
    } catch (error) {
      redirectToErrorPageByError(error, "로그아웃 처리 중 오류가 발생했습니다");
    }
  });
}

// 공통 헤더 DOM 생성
export function createHeader(options = {}) {
  const currentPath = options.currentPath || window.location.pathname;
  const userName = options.userName || "unknown";
  const navItemsHtml = buildNavItemsHtml(currentPath);

  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <div class="container app-header__inner">
      <a class="app-brand" href="${PAGE_PATHS.GRAD}">
        <span class="app-brand__mark">
          <img class="app-brand__icon" src="${getFluentIconPath("homeFilled")}" alt="" aria-hidden="true" />
        </span>
        <span class="app-brand__text">${SERVICE_NAME}</span>
      </a>

      <nav class="app-nav" aria-label="Primary">
        <ul class="app-nav__list">
          ${navItemsHtml}
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
        <span class="app-user__name">${userName}</span>
        <button class="app-user__logout" type="button" aria-label="Logout" data-logout-action>
          <img class="app-user__icon" src="${getFluentIconPath("signOut")}" alt="" aria-hidden="true" />
        </button>
      </div>
    </div>
  `;

  bindThemeToggle(header);
  bindLogoutAction(header);
  return header;
}

// 대상 컨테이너에 헤더 렌더링
export function renderHeader(target, options = {}) {
  const host = resolveElement(target);
  if (!host) return null;

  host.replaceChildren(createHeader(options));
  return host;
}
