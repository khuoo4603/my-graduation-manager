const MICRO_MAJOR_EMPTY_NOTICE = {
  variant: "empty",
  text: "표시할 마이크로전공 이수 현황이 없습니다.",
};

export const MICRO_MAJOR_ERROR_NOTICE = {
  variant: "error",
  text: "마이크로전공 이수 현황을 불러오지 못했습니다.",
};

const MICRO_MAJOR_PREVIEW_RESPONSE = {
  microMajors: [
    {
      id: 101,
      name: "백엔드개발",
      category: "전공",
      operatingUnitNames: "IT융합대학",
      status: "이수중",
      requiredCourseCount: 4,
      earnedCourseCount: 1,
      remainingCourseCount: 3,
      groups: [
        {
          groupNo: 1,
          groupName: "인정 과목",
          requiredCourseCount: 4,
          earnedCourseCount: 1,
          remainingCourseCount: 3,
          isSatisfied: false,
        },
      ],
      recognizedCourses: [{ courseId: 1001, courseCode: "BE101", courseName: "웹개발입문", earnedCredits: 3 }],
      missingCourses: [
        { courseCode: "BE201", courseName: "데이터베이스" },
        { courseCode: "BE301", courseName: "서버구축및형상관리" },
        { courseCode: "BE401", courseName: "백엔드프로그래밍" },
      ],
    },
    {
      id: 102,
      name: "프론트엔드개발",
      category: "전공",
      operatingUnitNames: "IT융합대학",
      status: "이수가능",
      requiredCourseCount: 4,
      earnedCourseCount: 0,
      remainingCourseCount: 4,
      groups: [
        {
          groupNo: 1,
          groupName: "인정 과목",
          requiredCourseCount: 4,
          earnedCourseCount: 0,
          remainingCourseCount: 4,
          isSatisfied: false,
        },
      ],
      recognizedCourses: [],
      missingCourses: [
        { courseCode: "FE101", courseName: "웹프로그래밍" },
        { courseCode: "FE201", courseName: "UI/UX디자인" },
        { courseCode: "FE301", courseName: "리액트프로그래밍" },
        { courseCode: "FE401", courseName: "모바일웹개발" },
      ],
    },
    {
      id: 103,
      name: "정보보호",
      category: "전공",
      operatingUnitNames: "정보보호학과",
      status: "이수완료",
      requiredCourseCount: 4,
      earnedCourseCount: 4,
      remainingCourseCount: 0,
      groups: [
        {
          groupNo: 1,
          groupName: "인정 과목",
          requiredCourseCount: 4,
          earnedCourseCount: 4,
          remainingCourseCount: 0,
          isSatisfied: true,
        },
      ],
      recognizedCourses: [
        { courseId: 1002, courseCode: "IS101", courseName: "정보보호개론", earnedCredits: 3 },
        { courseId: 1003, courseCode: "IS201", courseName: "암호학", earnedCredits: 3 },
        { courseId: 1004, courseCode: "IS301", courseName: "네트워크보안", earnedCredits: 3 },
        { courseId: 1005, courseCode: "IS401", courseName: "시스템보안", earnedCredits: 3 },
      ],
      missingCourses: [],
    },
    {
      id: 104,
      name: "기후생태",
      category: "교양",
      operatingUnitNames: "열림교양대학",
      status: "이수중",
      requiredCourseCount: 4,
      earnedCourseCount: 1,
      remainingCourseCount: 3,
      groups: [
        {
          groupNo: 1,
          groupName: "열림교양대학",
          requiredCourseCount: 1,
          earnedCourseCount: 1,
          remainingCourseCount: 0,
          isSatisfied: true,
        },
        {
          groupNo: 2,
          groupName: "열림교양대학",
          requiredCourseCount: 2,
          earnedCourseCount: 0,
          remainingCourseCount: 2,
          isSatisfied: false,
        },
        {
          groupNo: 3,
          groupName: "열림교양대학",
          requiredCourseCount: 1,
          earnedCourseCount: 0,
          remainingCourseCount: 1,
          isSatisfied: false,
        },
      ],
      recognizedCourses: [
        { groupNo: 1, courseId: 1006, courseCode: "CL101", courseName: "과학기술과 에콜로지", earnedCredits: 2 },
      ],
      missingCourses: [
        { groupNo: 2, courseCode: "CL201", courseName: "20세기환경사" },
        { groupNo: 2, courseCode: "CL202", courseName: "인류생존프로젝트" },
        { groupNo: 2, courseCode: "CL203", courseName: "자연과생명" },
        { groupNo: 2, courseCode: "CL204", courseName: "기후위기와지속가능한농업" },
        { groupNo: 3, courseCode: "CL301", courseName: "에너지의미래" },
        { groupNo: 3, courseCode: "CL302", courseName: "동물복지:인간과동물" },
        { groupNo: 3, courseCode: "CL303", courseName: "몸과윤리" },
        { groupNo: 3, courseCode: "CL304", courseName: "기후위기의이해" },
      ],
    },
    {
      id: 105,
      name: "글로벌사회복지",
      category: "융합",
      operatingUnitNames: "사회복지학+정치외교학",
      status: "이수중",
      requiredCourseCount: 5,
      earnedCourseCount: 3,
      remainingCourseCount: 2,
      groups: [
        {
          groupNo: 1,
          groupName: "정치외교학전공",
          requiredCourseCount: 3,
          earnedCourseCount: 2,
          remainingCourseCount: 1,
          isSatisfied: false,
        },
        {
          groupNo: 2,
          groupName: "사회복지학전공",
          requiredCourseCount: 2,
          earnedCourseCount: 1,
          remainingCourseCount: 1,
          isSatisfied: false,
        },
      ],
      recognizedCourses: [
        { groupNo: 1, courseId: 1008, courseCode: "GS101", courseName: "국제정치론", earnedCredits: 3 },
        { groupNo: 1, courseId: 1009, courseCode: "GS102", courseName: "국제개발협력", earnedCredits: 3 },
        { groupNo: 2, courseId: 1010, courseCode: "GS201", courseName: "지역사회복지론", earnedCredits: 3 },
      ],
      missingCourses: [
        { groupNo: 1, courseCode: "GS103", courseName: "개발협력의정치경제" },
        { groupNo: 1, courseCode: "GS104", courseName: "국제기구론" },
        { groupNo: 2, courseCode: "GS202", courseName: "사회복지실천론" },
        { groupNo: 2, courseCode: "GS203", courseName: "사회복지와문화다양성" },
      ],
    },
    {
      id: 106,
      name: "글로벌지속가능경영",
      category: "융합",
      operatingUnitNames: "경영학+환경과학",
      status: "이수가능",
      requiredCourseCount: 5,
      earnedCourseCount: 0,
      remainingCourseCount: 5,
      groups: [
        {
          groupNo: 1,
          groupName: "경영학전공",
          requiredCourseCount: 3,
          earnedCourseCount: 0,
          remainingCourseCount: 3,
          isSatisfied: false,
        },
        {
          groupNo: 2,
          groupName: "환경과학전공",
          requiredCourseCount: 2,
          earnedCourseCount: 0,
          remainingCourseCount: 2,
          isSatisfied: false,
        },
      ],
      recognizedCourses: [],
      missingCourses: [
        { groupNo: 1, courseCode: "GM101", courseName: "지속가능경영론" },
        { groupNo: 1, courseCode: "GM102", courseName: "글로벌경영전략" },
        { groupNo: 1, courseCode: "GM103", courseName: "ESG경영" },
        { groupNo: 2, courseCode: "GM201", courseName: "환경정책론" },
        { groupNo: 2, courseCode: "GM202", courseName: "기후변화와적응" },
        { groupNo: 2, courseCode: "GM203", courseName: "지속가능발전과녹색성장" },
      ],
    },
  ],
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

const MICRO_MAJOR_PREVIEW_ITEMS = Array.isArray(MICRO_MAJOR_PREVIEW_RESPONSE?.microMajors)
  ? MICRO_MAJOR_PREVIEW_RESPONSE.microMajors.map(buildMicroMajorCardViewModel).filter(Boolean)
  : [];

export const MICRO_MAJOR_PREVIEW_SECTION = {
  items: MICRO_MAJOR_PREVIEW_ITEMS,
  notice: null,
};

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

  // 실제 응답이 비어 있으면 preview 카드를 유지하고 소형 안내만 노출
  return {
    items: MICRO_MAJOR_PREVIEW_ITEMS,
    notice: MICRO_MAJOR_EMPTY_NOTICE,
  };
}
