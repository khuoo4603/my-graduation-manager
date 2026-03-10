// 값이 비어 있을 때 대체 문구를 반환
export function fallback(value, fallbackValue = "-") {
  if (value === null || value === undefined || value === "") {
    return fallbackValue;
  }

  return value;
}

// 숫자를 로케일 형식 문자열로 변환
export function formatNumber(value, locale = "en-US") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat(locale).format(value);
}

// 바이트 단위를 사람이 읽기 쉬운 파일 크기 문자열로 변환
export function formatFileSize(bytes) {
  if (typeof bytes !== "number" || bytes < 0 || Number.isNaN(bytes)) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatted = unitIndex === 0 ? String(size) : size.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
}

// 날짜/문자열 입력을 로케일 기반 날짜 문자열로 변환
export function formatDate(value, locale = "en-CA") {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

