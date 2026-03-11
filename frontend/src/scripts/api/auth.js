import { post } from "./client.js";

// 서버 세션 로그아웃 요청
export function logout() {
  return post("/api/v1/auth/logout");
}
