import { createElement } from "../utils/dom.js";

// 데이터가 없을 때 표시할 공통 빈 상태 컴포넌트를 생성
export function createEmptyState(options = {}) {
  const title = options.title || "No data";
  const description = options.description || "There is nothing to show yet.";

  return createElement("section", {
    className: "empty-state card",
    children: [
      createElement("h2", { className: "empty-state__title", text: title }),
      createElement("p", { className: "empty-state__description", text: description }),
    ],
  });
}
