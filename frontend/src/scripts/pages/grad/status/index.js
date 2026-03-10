import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/status.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { clearChildren, createElement, qs } from "/src/scripts/utils/dom.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";

// Graduation Status 페이지 초기화: 헤더 렌더링 후 페이지 기본 안내 문구를 출력
export function initStatusPage() {
  // 현재 경로에 맞춰 상단 헤더 활성 메뉴를 표시
  renderHeader("[data-header-root]", { currentPath: PAGE_PATHS.GRAD_STATUS });

  // 페이지 루트가 없으면 렌더링을 중단
  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  // 기존 내용을 초기화하고 현재 페이지의 안내 콘텐츠를 배치
  clearChildren(pageRoot);
  pageRoot.append(
    createElement("section", {
      className: "stack",
      children: [
        createElement("h1", { className: "page-title", text: "Graduation Status" }),
        createElement("p", {
          className: "page-subtitle",
          text: "졸업 판정 페이지입니다.",
        }),
      ],
    }),
  );
}

// 엔트리 로드시 페이지 초기화를 즉시 수행
initStatusPage();



