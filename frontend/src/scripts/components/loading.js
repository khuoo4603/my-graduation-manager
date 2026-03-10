import { createElement } from "../utils/dom.js";

// 로딩 상태를 표시하는 공통 컴포넌트를 생성
export function createLoading(options = {}) {
  const text = options.text || "Loading...";
  return createElement("div", {
    className: "loading-state",
    attrs: { role: "status", "aria-live": "polite" },
    children: [
      createElement("span", { className: "loading-state__spinner", attrs: { "aria-hidden": "true" } }),
      createElement("p", { className: "loading-state__text", text }),
    ],
  });
}
