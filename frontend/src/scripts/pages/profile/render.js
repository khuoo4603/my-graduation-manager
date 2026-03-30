import { getFluentIconPath } from "/src/scripts/components/icon-map.js";
import { clearChildren, createElement, setText } from "/src/scripts/utils/dom.js";

// 사용자 정보 렌더링
export function renderProfileSummary(page) {
  setText(page.elements.profileName, page.profile.user.name || "해당 없음");
  setText(page.elements.profileEmail, page.profile.user.email || "해당 없음");
}

// 기본 설정 카드 렌더링
export function renderBaseSettings(page) {
  const { departmentSelect, templateSelect } = page.elements;

  if (departmentSelect) {
    clearChildren(departmentSelect);

    const placeholder = new Option("학부를 선택하세요", "", !page.draft.departmentId, !page.draft.departmentId);
    placeholder.disabled = true;
    departmentSelect.append(placeholder);

    page.catalogs.departments.forEach((department) => {
      departmentSelect.append(new Option(department.name || "", department.id, false, page.draft.departmentId === department.id));
    });

    departmentSelect.value = page.draft.departmentId;
  }

  if (templateSelect) {
    clearChildren(templateSelect);

    const placeholder = new Option("졸업 템플릿을 선택하세요", "", !page.draft.templateId, !page.draft.templateId);
    placeholder.disabled = true;
    templateSelect.append(placeholder);

    page.catalogs.templates.forEach((template) => {
      const label = template.applicableYear ? `${template.name} (${template.applicableYear})` : template.name || "";
      templateSelect.append(new Option(label, template.id, false, page.draft.templateId === template.id));
    });

    templateSelect.value = page.draft.templateId;
  }
}

// 전공 추가 폼 렌더링
export function renderMajorForm(page) {
  const { majorDepartmentSelect, majorSelect, majorTypeSelect } = page.elements;
  const filteredMajors = page.draft.majorFormDepartmentId
    ? page.catalogs.majors.filter((major) => major.departmentId === page.draft.majorFormDepartmentId)
    : [];

  if (!filteredMajors.some((major) => major.id === page.draft.majorFormMajorId)) {
    page.draft.majorFormMajorId = "";
  }

  if (majorDepartmentSelect) {
    clearChildren(majorDepartmentSelect);

    const placeholder = new Option(
      "학부를 선택하세요",
      "",
      !page.draft.majorFormDepartmentId,
      !page.draft.majorFormDepartmentId,
    );
    placeholder.disabled = true;
    majorDepartmentSelect.append(placeholder);

    page.catalogs.departments.forEach((department) => {
      majorDepartmentSelect.append(
        new Option(department.name || "", department.id, false, page.draft.majorFormDepartmentId === department.id),
      );
    });

    majorDepartmentSelect.value = page.draft.majorFormDepartmentId;
  }

  if (majorSelect) {
    clearChildren(majorSelect);

    const placeholder = new Option("전공을 선택하세요", "", !page.draft.majorFormMajorId, !page.draft.majorFormMajorId);
    placeholder.disabled = true;
    majorSelect.append(placeholder);

    filteredMajors.forEach((major) => {
      majorSelect.append(new Option(major.name || "", major.id, false, page.draft.majorFormMajorId === major.id));
    });

    majorSelect.value = page.draft.majorFormMajorId;
  }

  if (majorTypeSelect) {
    majorTypeSelect.value = page.draft.majorFormMajorType || page.defaultMajorType;
  }
}

// 전공 목록 렌더링
export function renderMajorList(page) {
  const { majorList, majorEmpty } = page.elements;

  if (!majorList || !majorEmpty) return;

  clearChildren(majorList);

  page.draft.majors.forEach((major) => {
    const item = createElement("li", {
      className: "profile-major-item",
      dataset: { majorDraftId: major.draftId },
    });

    const icon = createElement("span", { className: "profile-major-item__icon", attrs: { "aria-hidden": "true" } });
    icon.append(
      createElement("img", {
        attrs: {
          src: getFluentIconPath("person"),
          alt: "",
        },
      }),
    );

    const nameChip = createElement("span", {
      className: "profile-major-chip profile-major-chip--name",
      text: major.name || "",
    });

    const typeChip = createElement("span", {
      className: "profile-major-chip profile-major-chip--type",
      text: major.majorType || "",
    });

    const deleteButton = createElement("button", {
      className: "btn btn--ghost btn--icon profile-major-item__remove",
      attrs: {
        type: "button",
        "aria-label": "Remove major",
      },
      dataset: {
        majorDelete: "",
        majorDraftId: major.draftId,
      },
    });

    deleteButton.append(
      createElement("img", {
        attrs: {
          src: getFluentIconPath("delete"),
          alt: "",
        },
      }),
    );

    item.append(icon, nameChip, typeChip, deleteButton);
    majorList.append(item);
  });

  majorEmpty.hidden = page.draft.majors.length > 0;
}

// 저장 중 상태 렌더링
export function renderPendingState(page) {
  const { elements, pending, draft } = page;

  if (elements.departmentSelect) elements.departmentSelect.disabled = pending.isBaseSaving;
  if (elements.templateSelect) elements.templateSelect.disabled = pending.isBaseSaving;
  if (elements.baseSettingsCancelButton) elements.baseSettingsCancelButton.disabled = pending.isBaseSaving;
  if (elements.baseSettingsSaveButton) elements.baseSettingsSaveButton.disabled = pending.isBaseSaving;

  if (elements.majorDepartmentSelect) elements.majorDepartmentSelect.disabled = pending.isMajorsSaving;
  if (elements.majorSelect) elements.majorSelect.disabled = pending.isMajorsSaving || !draft.majorFormDepartmentId;
  if (elements.majorTypeSelect) elements.majorTypeSelect.disabled = pending.isMajorsSaving;
  if (elements.majorAddButton) elements.majorAddButton.disabled = pending.isMajorsSaving;
  if (elements.majorCancelButton) elements.majorCancelButton.disabled = pending.isMajorsSaving;
  if (elements.majorSaveButton) elements.majorSaveButton.disabled = pending.isMajorsSaving;

  Array.from(elements.majorList?.querySelectorAll("[data-major-delete]") || []).forEach((button) => {
    button.disabled = pending.isMajorsSaving;
  });
}

// Profile 페이지 전체 갱신
export function renderProfilePage(page) {
  renderProfileSummary(page);
  renderBaseSettings(page);
  renderMajorForm(page);
  renderMajorList(page);
  renderPendingState(page);
}
