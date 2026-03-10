import add24Regular from "/src/assets/icons/fluent/add_24_regular.svg";
import apps24Regular from "/src/assets/icons/fluent/apps_24_regular.svg";
import book24Regular from "/src/assets/icons/fluent/book_24_regular.svg";
import clipboardTask24Regular from "/src/assets/icons/fluent/clipboard_task_24_regular.svg";
import delete24Regular from "/src/assets/icons/fluent/delete_24_regular.svg";
import edit24Regular from "/src/assets/icons/fluent/edit_24_regular.svg";
import folder24Regular from "/src/assets/icons/fluent/folder_24_regular.svg";
import home24Regular from "/src/assets/icons/fluent/home_24_regular.svg";
import home24Filled from "/src/assets/icons/fluent/home_24_filled.svg";
import person24Regular from "/src/assets/icons/fluent/person_24_regular.svg";
import search24Regular from "/src/assets/icons/fluent/search_24_regular.svg";
import signOut24Regular from "/src/assets/icons/fluent/sign_out_24_regular.svg";
import warning24Regular from "/src/assets/icons/fluent/warning_24_regular.svg";
import weatherMoon24Regular from "/src/assets/icons/fluent/weather_moon_24_regular.svg";
import weatherSunny24Regular from "/src/assets/icons/fluent/weather_sunny_24_regular.svg";

// 프로젝트 재사용 Fluent 아이콘 경로 매핑
export const FLUENT_ICON_PATHS = {
  add: add24Regular,
  apps: apps24Regular,
  book: book24Regular,
  clipboardTask: clipboardTask24Regular,
  delete: delete24Regular,
  edit: edit24Regular,
  folder: folder24Regular,
  home: home24Regular,
  homeFilled: home24Filled,
  person: person24Regular,
  search: search24Regular,
  signOut: signOut24Regular,
  warning: warning24Regular,
  weatherMoon: weatherMoon24Regular,
  weatherSunny: weatherSunny24Regular,
};

// 키 기반으로 아이콘 경로를 안전하게 조회
export function getFluentIconPath(key) {
  return FLUENT_ICON_PATHS[key] || "";
}
