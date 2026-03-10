import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/error.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { clearChildren, createElement, qs } from "/src/scripts/utils/dom.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";
import { getFluentIconPath } from "/src/scripts/components/icon-map.js";

// Error 페이지 초기화: 헤더와 경고 아이콘/안내 문구를 렌더링
export function initErrorPage() {
  // 현재 경로를 기준으로 Error 메뉴 상태를 반영
  renderHeader("[data-header-root]", { currentPath: PAGE_PATHS.ERROR });

  // 렌더링 대상 루트가 없으면 중단
  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  // 기존 내용을 제거한 뒤 에러 안내 블록을 구성
  clearChildren(pageRoot);
  pageRoot.append(
    createElement("section", {
      className: "stack",
      children: [
        createElement("h1", { className: "page-title", text: "Error" }),
        createElement("img", {
          className: "page-icon",
          attrs: {
            src: getFluentIconPath("warning"),
            alt: "",
            "aria-hidden": "true",
          },
        }),
        createElement("p", {
          className: "page-subtitle",
          text: "오류 페이지입니다.",
        }),
      ],
    }),
  );
}

// 엔트리 로드 시 에러 페이지를 초기화
initErrorPage();



