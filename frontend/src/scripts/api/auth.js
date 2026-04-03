import { del, post } from "./client.js";

// 서버 세션 로그아웃 요청
export function logout() {
  return post("/api/v1/auth/logout");
}

// 현재 로그인 사용자 계정을 삭제
export function deleteAccount() {
  return del("/api/v1/account");
}
