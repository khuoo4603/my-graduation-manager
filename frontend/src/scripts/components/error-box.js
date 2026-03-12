// 에러 정보를 사용자에게 보여줄 공통 경고 박스를 생성
export function createErrorBox(errorOrMessage, options = {}) {
  const title = options.title || "Something went wrong";
  const message =
    typeof errorOrMessage === "string" ? errorOrMessage : errorOrMessage?.message || "An unknown error occurred.";

  const root = document.createElement("section");
  root.className = "error-box message-box message-box--error";
  root.setAttribute("role", "alert");
  root.innerHTML = `
    <h2 class="error-box__title">${title}</h2>
    <p class="error-box__message">${message}</p>
  `;

  return root;
}
