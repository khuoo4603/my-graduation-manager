import "/src/styles/base.css";
import "/src/styles/layout.css";
import "/src/styles/components.css";
import "/src/styles/pages/courses.css";

import { renderHeader } from "/src/scripts/components/header.js";
import { clearChildren, createElement, qs } from "/src/scripts/utils/dom.js";
import { PAGE_PATHS } from "/src/scripts/utils/constants.js";

// Courses 페이지 초기화: 상단 헤더와 기본 안내 문구를 렌더링
export function initCoursesPage() {
  // 현재 경로를 기준으로 Courses 메뉴를 활성화
  renderHeader("[data-header-root]", { currentPath: PAGE_PATHS.GRAD_COURSES });

  // 페이지 루트 미존재 시 렌더링 중단
  const pageRoot = qs("[data-page-root]");
  if (!pageRoot) return;

  // 기존 콘텐츠를 지우고 페이지 제목/설명을 배치
  clearChildren(pageRoot);
  pageRoot.append(
    createElement("section", {
      className: "stack",
      children: [
        createElement("h1", { className: "page-title", text: "Courses" }),
        createElement("p", {
          className: "page-subtitle",
          text: "수강 과목 페이지입니다.",
        }),
      ],
    }),
  );
}

// 엔트리 로드 시 페이지를 즉시 초기화
initCoursesPage();
