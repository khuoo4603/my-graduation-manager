import { createElement, resolveElement } from "../utils/dom.js";
import { PAGE_PATHS, SERVICE_NAME } from "../utils/constants.js";
import { getFluentIconPath } from "./icon-map.js";

// 경로 비교 전 끝의 슬래시를 정리해 동일 경로 판별을 안정화
function normalizePath(pathname = "") {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

// 현재 경로가 대상 경로와 같은지 확인
function isActivePath(pathname, targetPath) {
  return normalizePath(pathname) === normalizePath(targetPath);
}

// 공통 헤더 DOM을 생성
export function createHeader(options = {}) {
  const currentPath = options.currentPath || window.location.pathname;

  // 상단 네비게이션 노출 페이지 목록
  const navItems = [
    { label: "Dashboard", href: PAGE_PATHS.GRAD, icon: "apps" },
    { label: "Courses", href: PAGE_PATHS.GRAD_COURSES, icon: "book" },
    { label: "Graduation Status", href: PAGE_PATHS.GRAD_STATUS, icon: "clipboardTask" },
    { label: "Storage", href: PAGE_PATHS.STORAGE, icon: "folder" },
    { label: "Profile", href: PAGE_PATHS.PROFILE, icon: "person" },
  ];

  const header = createElement("header", { className: "app-header" });
  const container = createElement("div", { className: "container app-header__inner" });

  const brand = createElement("a", {
    className: "app-brand",
    attrs: { href: PAGE_PATHS.GRAD },
    children: [
      createElement("span", {
        className: "app-brand__mark",
        children: [
          createElement("img", {
            className: "app-brand__icon",
            attrs: {
              src: getFluentIconPath("homeFilled"),
              alt: "",
              "aria-hidden": "true",
            },
          }),
        ],
      }),
      createElement("span", { className: "app-brand__text", text: SERVICE_NAME }),
    ],
  });

  const nav = createElement("nav", {
    className: "app-nav",
    attrs: { "aria-label": "Primary" },
  });

  const navList = createElement("ul", { className: "app-nav__list" });
  navItems.forEach((item) => {
    const link = createElement("a", {
      className: `app-nav__link${isActivePath(currentPath, item.href) ? " is-active" : ""}`,
      attrs: { href: item.href },
      children: [
        createElement("img", {
          className: "app-nav__icon",
          attrs: {
            src: getFluentIconPath(item.icon),
            alt: "",
            "aria-hidden": "true",
          },
        }),
        createElement("span", { text: item.label }),
      ],
    });
    navList.append(createElement("li", { className: "app-nav__item", children: [link] }));
  });

  nav.append(navList);

  // 라이트/다크 모드 토글 버튼의 아이콘을 구성
  const themeIcon = createElement("img", {
    className: "app-user__icon",
    attrs: {
      src: getFluentIconPath("weatherMoon"),
      alt: "",
      "aria-hidden": "true",
    },
  });

  const themeToggle = createElement("button", {
    className: "app-user__theme",
    attrs: {
      type: "button",
      "aria-label": "Toggle theme",
      "aria-pressed": "false",
      title: "Toggle light and dark mode",
    },
    children: [themeIcon],
  });

  // 토글 상태를 aria-pressed에 저장하고 아이콘만 전환
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

  const user = createElement("div", {
    className: "app-user",
    children: [
      themeToggle,
      createElement("span", {
        className: "app-user__avatar",
        children: [
          createElement("img", {
            className: "app-user__icon",
            attrs: {
              src: getFluentIconPath("person"),
              alt: "",
              "aria-hidden": "true",
            },
          }),
        ],
      }),
      createElement("span", { className: "app-user__name", text: "unknown" }),
      createElement("a", {
        className: "app-user__logout",
        attrs: { href: PAGE_PATHS.HOME, "aria-label": "Logout" },
        children: [
          createElement("img", {
            className: "app-user__icon",
            attrs: {
              src: getFluentIconPath("signOut"),
              alt: "",
              "aria-hidden": "true",
            },
          }),
        ],
      }),
    ],
  });

  container.append(brand, nav, user);
  header.append(container);

  return header;
}

// 대상 컨테이너에 헤더를 렌더링
export function renderHeader(target, options = {}) {
  const host = resolveElement(target);
  if (!host) return null;

  host.replaceChildren(createHeader(options));
  return host;
}
