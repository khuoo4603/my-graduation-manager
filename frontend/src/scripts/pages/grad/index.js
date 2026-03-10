import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/grad.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { clearChildren, createElement, qs } from "/src/scripts/utils/dom.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";

// Dashboard 페이지 초기화: 헤더 렌더링 후 기본 안내 블록을 표시
export function initGradPage() {
  // 현재 경로에 맞는 네비게이션 활성 상태를 반영
  renderHeader("[data-header-root]", { currentPath: PAGE_PATHS.GRAD });

  // 렌더링 대상 루트가 존재하는지 확인
  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  // 페이지 루트를 비우고 대시보드 안내 콘텐츠를 삽입
  clearChildren(pageRoot);
  pageRoot.append(
    createElement("section", {
      className: "stack",
      children: [
        createElement("h1", { className: "page-title", text: "Dashboard" }),
        createElement("p", {
          className: "page-subtitle",
          text: "대시보드 페이지입니다.",
        }),
      ],
    }),
  );
}

// 엔트리 로드시 초기화 실행
initGradPage();



