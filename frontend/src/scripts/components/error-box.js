import { createElement } from "../utils/dom.js";

// 에러 정보를 사용자에게 보여줄 공통 경고 박스를 생성
export function createErrorBox(errorOrMessage, options = {}) {
  const title = options.title || "Something went wrong";
  const message =
    typeof errorOrMessage === "string" ? errorOrMessage : errorOrMessage?.message || "An unknown error occurred.";

  return createElement("section", {
    className: "error-box message-box message-box--error",
    attrs: { role: "alert" },
    children: [
      createElement("h2", { className: "error-box__title", text: title }),
      createElement("p", { className: "error-box__message", text: message }),
    ],
  });
}
