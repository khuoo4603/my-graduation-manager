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

// 템플릿명과 적용 연도를 헤더 요약 카드 라벨로 정리
function formatTemplateLabel(template) {
  const name = String(template?.name || "").trim();
  const year = String(template?.applicableYear ?? template?.year ?? "").trim();

  if (!name) return "미설정";
  return year ? `${name} (${year})` : name;
}

// 전공 목록을 헤더 요약 카드용 한 줄 문자열로 정리
function formatMajorSummary(majors) {
  const labels = Array.isArray(majors)
    ? majors
        .map((major) => {
          const name = String(major?.name || major?.majorName || "").trim();
          const type = String(major?.majorType || major?.type || "").trim();

          if (!name) return null;
          return type ? `${name} (${type})` : name;
        })
        .filter(Boolean)
    : [];

  return labels.length > 0 ? labels.join(", ") : "미설정";
}

// 헤더 우측 프로필 요약 카드에 들어갈 사용자 정보를 정리
function resolveHeaderProfileSummary(profile, fallbackUserName) {
  return {
    name: String(profile?.user?.name || fallbackUserName || "unknown").trim() || "unknown",
    email: String(profile?.user?.email || "").trim() || "unknown",
    department: String(profile?.department?.name || "").trim() || "미설정",
    template: formatTemplateLabel(profile?.template),
    majorSummary: formatMajorSummary(profile?.majors),
  };
}

// 헤더 이벤트 대상 요소 수집
function collectHeaderElements(host) {
  return {
    logoutButton: host.querySelector("[data-logout-action]"),
    profileSummaryRoot: host.querySelector("[data-profile-summary-root]"),
    profileBadge: host.querySelector("[data-profile-badge]"),
    profileSummaryCard: host.querySelector("[data-profile-summary-card]"),
  };
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

// 프로필 뱃지 hover / click 고정 / 바깥 클릭 닫힘 인터랙션 처리
function bindProfileSummaryEvents(elements) {
  const { profileSummaryRoot, profileBadge, profileSummaryCard } = elements;
  if (!profileSummaryRoot || !profileBadge || !profileSummaryCard) return;

  const state = {
    isHoverOpen: false,
    isPinnedOpen: false,
  };

  function renderProfileSummaryState() {
    const isOpen = state.isPinnedOpen || state.isHoverOpen;
    profileSummaryRoot.classList.toggle("is-open", isOpen);
    profileBadge.setAttribute("aria-expanded", isOpen ? "true" : "false");
    profileSummaryCard.hidden = !isOpen;
  }

  // 프로필 뱃지 영역 mouseenter 이벤트
  profileSummaryRoot.addEventListener("mouseenter", () => {
    if (state.isPinnedOpen) return;
    state.isHoverOpen = true;
    renderProfileSummaryState();
  });

  // 프로필 뱃지 영역 mouseleave 이벤트
  profileSummaryRoot.addEventListener("mouseleave", () => {
    if (state.isPinnedOpen) return;
    state.isHoverOpen = false;
    renderProfileSummaryState();
  });

  // 프로필 뱃지 click 이벤트
  profileBadge.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    state.isPinnedOpen = !state.isPinnedOpen;
    state.isHoverOpen = state.isPinnedOpen;
    renderProfileSummaryState();
  });

  // 프로필 요약 카드 내부 click 이벤트
  profileSummaryCard.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  // 문서 바깥 영역 click 이벤트
  document.addEventListener("click", (event) => {
    // 뱃지나 요약 카드 내부 클릭은 바깥 클릭 닫힘에서 제외
    if (!(event.target instanceof Node)) return;
    if (profileSummaryRoot.contains(event.target)) return;

    state.isPinnedOpen = false;
    state.isHoverOpen = false;
    renderProfileSummaryState();
  });

  renderProfileSummaryState();
}

// 헤더 버튼 이벤트 바인딩
function bindHeaderEvents(elements) {
  bindProfileSummaryEvents(elements);

  // 로그아웃 버튼 click 이벤트
  elements.logoutButton?.addEventListener("click", handleHeaderLogout);
}

// 공통 헤더 렌더링
export function renderHeader(target, options = {}) {
  const host = target instanceof Element ? target : typeof target === "string" ? document.querySelector(target) : null;
  if (!host) return null;

  const currentPath = options.currentPath || window.location.pathname;
  const userName = options.userName || "unknown";
  const profileSummary = resolveHeaderProfileSummary(options.profile, userName);
  const dashboardActive = isActivePath(currentPath, PAGE_PATHS.GRAD) ? " is-active" : "";
  const coursesActive = isActivePath(currentPath, PAGE_PATHS.GRAD_COURSES) ? " is-active" : "";
  const statusActive = isActivePath(currentPath, PAGE_PATHS.GRAD_STATUS) ? " is-active" : "";
  const storageActive = isActivePath(currentPath, PAGE_PATHS.STORAGE) ? " is-active" : "";

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
          </ul>
        </nav>

        <div class="app-user">
          <button
            class="app-user__theme"
            type="button"
            aria-label="다크 모드 비활성화"
            title="다크 모드 비활성화"
            data-theme-toggle
            disabled
          >
            <img class="app-user__icon" src="${getFluentIconPath("weatherMoon")}" alt="" aria-hidden="true" />
          </button>

          <div class="app-user__profile" data-profile-summary-root>
            <button class="app-user__badge" type="button" aria-haspopup="dialog" aria-expanded="false" data-profile-badge>
              <span class="app-user__avatar">
                <img class="app-user__icon" src="${getFluentIconPath("person")}" alt="" aria-hidden="true" />
              </span>
              <span class="app-user__name">${escapeHtml(profileSummary.name)}</span>
            </button>

            <div class="app-user__summary-card" data-profile-summary-card hidden>
              <div class="app-user__summary-hero">
                <span class="app-user__summary-avatar">
                  <img class="app-user__icon" src="${getFluentIconPath("person")}" alt="" aria-hidden="true" />
                </span>
                <div class="app-user__summary-identity">
                  <strong class="app-user__summary-name">${escapeHtml(profileSummary.name)}</strong>
                  <span class="app-user__summary-email" title="${escapeHtml(profileSummary.email)}">${escapeHtml(profileSummary.email)}</span>
                </div>
              </div>

              <dl class="app-user__summary-list">
                <div class="app-user__summary-row">
                  <dt>학부</dt>
                  <dd>${escapeHtml(profileSummary.department)}</dd>
                </div>
                <div class="app-user__summary-row">
                  <dt>템플릿</dt>
                  <dd>${escapeHtml(profileSummary.template)}</dd>
                </div>
                <div class="app-user__summary-row">
                  <dt>전공</dt>
                  <dd>${escapeHtml(profileSummary.majorSummary)}</dd>
                </div>
              </dl>

              <a class="btn btn--secondary app-user__summary-action" href="${PAGE_PATHS.PROFILE}">
                <img class="app-user__icon" src="${getFluentIconPath("edit")}" alt="" aria-hidden="true" />
                <span>수정하기</span>
              </a>
            </div>
          </div>

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
