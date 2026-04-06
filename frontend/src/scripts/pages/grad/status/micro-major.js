const MICRO_MAJOR_EMPTY_NOTICE = {
  variant: "empty",
  title: "표시할 마이크로전공 이수 현황이 없습니다.",
  description: "",
};

export const MICRO_MAJOR_ERROR_NOTICE = {
  variant: "error",
  title: "마이크로전공 이수 현황을 불러오지 못했습니다.",
  description: "네트워크 연결을 확인해 주세요",
};

// 마이크로전공 응답 수치를 안전한 number로 정리
function toSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

// 진행률 퍼센트를 0~100 범위로 보정
function resolveProgressPercent(earned, required) {
  if (required <= 0) return 0;
  return Math.max(0, Math.min((earned / required) * 100, 100));
}

// 마이크로전공 상태값을 화면 표시용 정책으로 변환
function normalizeMicroMajorStatus(status) {
  const normalized = String(status || "").trim();

  if (normalized === "이수완료") return "이수완료";
  if (normalized === "이수중") return "이수중";
  if (normalized === "이수대상아님") return "이수가능";
  return "이수가능";
}

// 마이크로전공 상태에 맞는 배지 색상 결정
function resolveMicroMajorBadgeVariant(status) {
  if (status === "이수완료") return "badge--green";
  if (status === "이수중") return "badge--blue";
  return "";
}

// category 값을 카드 메타 형식에 맞춰 정리
function formatMicroMajorCategory(category) {
  const normalized = String(category || "").trim();
  if (!normalized) return "";
  return normalized.endsWith("형") ? normalized : `${normalized}형`;
}

// 그룹 개수에 따라 카드 상세 레이아웃 결정
function resolveMicroMajorLayout(microMajor) {
  const groups = Array.isArray(microMajor?.groups) ? microMajor.groups : [];

  if (groups.length <= 1) {
    // 단일 그룹 마이크로전공은 과목 목록형으로 렌더링
    return "course-list";
  }

  // 2개 이상 그룹이 있으면 모두 내부 카드형으로 렌더링
  return "group-blocks";
}

// 단일 목록형 카드용 과목 목록 생성
function buildMicroMajorCourseItems(recognizedCourses, missingCourses) {
  const recognizedNames = new Set(
    (Array.isArray(recognizedCourses) ? recognizedCourses : [])
      .map((course) => String(course?.courseName || "").trim())
      .filter(Boolean),
  );
  const seenNames = new Set();
  const items = [];

  [...(Array.isArray(recognizedCourses) ? recognizedCourses : []), ...(Array.isArray(missingCourses) ? missingCourses : [])].forEach(
    (course) => {
      const courseName = String(course?.courseName || "").trim();
      if (!courseName || seenNames.has(courseName)) return;

      seenNames.add(courseName);
      items.push({
        name: courseName,
        isRecognized: recognizedNames.has(courseName),
      });
    },
  );

  return {
    recognizedNames,
    items,
  };
}

// 그룹 번호 기준으로 실제 이수/미이수 과목 목록 생성
function buildMicroMajorGroupCourseItems(microMajor, groupNo) {
  const recognizedNames = new Set();
  const seenNames = new Set();
  const items = [];
  const recognizedCourses = Array.isArray(microMajor?.recognizedCourses) ? microMajor.recognizedCourses : [];
  const missingCourses = Array.isArray(microMajor?.missingCourses) ? microMajor.missingCourses : [];

  recognizedCourses
    .filter((course) => toSafeNumber(course?.groupNo) === groupNo)
    .forEach((course) => {
      const courseName = String(course?.courseName || "").trim();
      if (!courseName || seenNames.has(courseName)) return;

      recognizedNames.add(courseName);
      seenNames.add(courseName);
      items.push({
        name: courseName,
        isRecognized: true,
      });
    });

  missingCourses
    .filter((course) => toSafeNumber(course?.groupNo) === groupNo)
    .forEach((course) => {
      const courseName = String(course?.courseName || "").trim();
      if (!courseName || seenNames.has(courseName)) return;

      seenNames.add(courseName);
      items.push({
        name: courseName,
        isRecognized: recognizedNames.has(courseName),
      });
    });

  if (items.length > 0) {
    // 그룹별 과목이 내려오면 실제 응답만으로 목록 구성
    return items;
  }

  // 그룹별 과목 정보가 없으면 다음 단계 연결 전까지 placeholder만 표시
  return [];
}

// 그룹 블록형 카드용 하위 그룹 데이터 생성
function buildMicroMajorGroupBlocks(microMajor, recognizedNames) {
  const groups = Array.isArray(microMajor?.groups) ? microMajor.groups : [];

  return groups.map((group, index) => {
    const rawGroupName = String(group?.groupName || "").trim();
    const isGenericGroupName = !rawGroupName || /^영역\s*\d+$/u.test(rawGroupName) || /^그룹\s*\d+$/u.test(rawGroupName);
    const rawTitle = isGenericGroupName ? `그룹 ${index + 1}` : rawGroupName;
    const title = rawTitle === "열림교양대학" ? "열림교양" : rawTitle;
    const groupNo = toSafeNumber(group?.groupNo) || index + 1;
    const courses = buildMicroMajorGroupCourseItems(microMajor, groupNo);
    const candidateCount = courses.length;

    return {
      groupNo,
      title,
      summaryText: `후보 ${candidateCount}과목 중 ${toSafeNumber(group?.requiredCourseCount)}과목 이수`,
      courses: courses.map((course) => ({
        ...course,
        isRecognized: course.isRecognized || recognizedNames.has(course.name),
      })),
      placeholderText: "세부 과목 연결은 다음 단계에서 추가됩니다.",
    };
  });
}

// 마이크로전공 카드 1개를 화면용 데이터로 변환
function buildMicroMajorCardViewModel(microMajor) {
  const name = String(microMajor?.name || "").trim();
  if (!name) return null;

  const statusText = normalizeMicroMajorStatus(microMajor?.status);
  const requiredCourseCount = toSafeNumber(microMajor?.requiredCourseCount);
  const earnedCourseCount = toSafeNumber(microMajor?.earnedCourseCount);
  const remainingCourseCount = toSafeNumber(microMajor?.remainingCourseCount);
  const layout = resolveMicroMajorLayout(microMajor);
  const { recognizedNames, items: courses } = buildMicroMajorCourseItems(
    microMajor?.recognizedCourses,
    microMajor?.missingCourses,
  );
  const metaParts = [formatMicroMajorCategory(microMajor?.category), String(microMajor?.operatingUnitNames || "").trim()].filter(
    Boolean,
  );

  return {
    id: microMajor?.id,
    name,
    metaText: metaParts.join(" · "),
    statusText,
    badgeVariant: resolveMicroMajorBadgeVariant(statusText),
    progressPercent: resolveProgressPercent(earnedCourseCount, requiredCourseCount),
    summaryText: `필요 ${requiredCourseCount}과목 / 이수 ${earnedCourseCount}과목 / 남은 ${remainingCourseCount}과목`,
    layout,
    detailTitle: layout === "course-list" ? "인정 과목 목록" : "그룹별 이수 현황",
    courses,
    groupBlocks: layout === "group-blocks" ? buildMicroMajorGroupBlocks(microMajor, recognizedNames) : [],
  };
}

// 실제 응답을 마이크로전공 섹션 렌더링 데이터로 변환
export function buildMicroMajorSectionModel(response) {
  const items = Array.isArray(response?.microMajors)
    ? response.microMajors.map(buildMicroMajorCardViewModel).filter(Boolean)
    : [];

  if (items.length > 0) {
    return {
      items,
      notice: null,
    };
  }

  // 실제 응답이 비어 있으면 preview 대신 실제 빈 상태를 우선 렌더링
  return {
    items: [],
    notice: MICRO_MAJOR_EMPTY_NOTICE,
  };
}
