import { API_BASE_URL } from "../utils/constants.js";

const HTTP_NO_CONTENT = 204;

// API 요청 실패 정보 표준 전달용 커스텀 에러 객체
export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? 0;
    this.code = options.code ?? "UNKNOWN_ERROR";
    this.url = options.url ?? "";
    this.method = options.method ?? "GET";
    this.data = options.data ?? null;
  }
}

// body가 JSON 직렬화 대상인지 판별
// FormData, Blob, URLSearchParams, ArrayBuffer 제외 대상
function isJsonLikeBody(body) {
  if (body === null || body === undefined) return false; // body가 없음
  if (body instanceof FormData) return false; // FormData 원본 전송 대상
  if (body instanceof Blob) return false; // Blob 원본 전송 대상
  if (body instanceof URLSearchParams) return false; // URLSearchParams 원본 전송 대상
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) return false; // ArrayBuffer 원본 전송 대상

  return typeof body === "object"; // 일반 객체/배열 JSON 직렬화 대상
}

// API 베이스 URL과 path/query 조합 기반 최종 요청 URL 생성
export function buildUrl(path, query = null) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryParams = new URLSearchParams();

  // query 객체 기반 search params 구성
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return; // undefined, null, 빈 문자열 제외

      // 배열 값 다중 파라미터 처리
      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.append(key, String(item)));
        return;
      }

      queryParams.set(key, String(value)); // 일반 값 단일 파라미터 처리
    });
  }

  const baseUrl = API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// 응답 상태와 타입에 따라 본문을 적절한 형태로 파싱
async function parseResponseBody(response, responseType) {
  if (response.status === HTTP_NO_CONTENT) return null; // 204 No Content 응답 처리
  if (responseType === "blob") return response.blob(); // Blob 응답 타입 처리
  if (responseType === "text") return response.text(); // Text 응답 타입 처리

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json(); // JSON Content-Type 응답 처리

  return response.text(); // 비JSON 응답 기본 text 처리
}

// 공통 fetch 래퍼: 헤더/바디/에러 처리 규칙을 일관되게 적용
export async function request(path, options = {}) {
  const { method = "GET", query = null, body, headers = {}, responseType = "json", signal } = options;

  const url = buildUrl(path, query);
  const requestHeaders = new Headers(headers);

  // 쿠키 인증 전제 공통 fetch 옵션
  const fetchOptions = {
    method,
    credentials: "include",
    headers: requestHeaders,
    signal,
  };

  // body 존재 시 전송 형식 분기
  if (body !== undefined) {
    // 일반 객체/배열 JSON 직렬화 처리
    if (isJsonLikeBody(body)) {
      // Content-Type 기본값 보정
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }
      fetchOptions.body = JSON.stringify(body);
    } else {
      // FormData, Blob 등 원본 바디 처리
      fetchOptions.body = body;
    }
  }

  let response;

  try {
    // 실제 네트워크 요청 수행
    response = await fetch(url, fetchOptions);
  } catch (error) {
    // 서버 응답 이전 네트워크 오류 변환
    throw new ApiError("Network request failed", {
      status: 0,
      code: "NETWORK_ERROR",
      url,
      method,
      data: { cause: error instanceof Error ? error.message : String(error) },
    });
  }

  // 응답 상태/타입 기반 본문 파싱
  const data = await parseResponseBody(response, responseType);

  // 비정상 HTTP 응답 공통 예외 변환
  if (!response.ok) {
    // 서버 message 우선 사용 규칙
    const errorMessage =
      (data && typeof data === "object" && "message" in data && data.message) ||
      response.statusText ||
      "Request failed";

    let code = "HTTP_ERROR";

    if (response.status === 401) code = "UNAUTHORIZED"; // 401 인증 실패 코드 매핑
    if (response.status === 403) code = "FORBIDDEN"; // 403 권한 부족 코드 매핑
    if (response.status >= 500) code = "SERVER_ERROR"; // 5xx 서버 오류 코드 매핑

    throw new ApiError(String(errorMessage), {
      status: response.status,
      code,
      url,
      method,
      data,
    });
  }

  return data;
}

// GET 요청 헬퍼
export function get(path, options = {}) {
  return request(path, { ...options, method: "GET" });
}

// POST 요청 헬퍼
export function post(path, body, options = {}) {
  return request(path, { ...options, method: "POST", body });
}

// PUT 요청 헬퍼
export function put(path, body, options = {}) {
  return request(path, { ...options, method: "PUT", body });
}

// PATCH 요청 헬퍼
export function patch(path, body, options = {}) {
  return request(path, { ...options, method: "PATCH", body });
}

// DELETE 요청 헬퍼
export function del(path, options = {}) {
  return request(path, { ...options, method: "DELETE" });
}
