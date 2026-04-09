# SKHU Track

### 성공회대학교 학생을 위한 졸업 관리 서비스입니다.

졸업요건을 확인하고 졸업 자료관리, 수강 전략 시뮬레이션이 가능합니다.

## 주요 기능

- 학점관리: 대시보드의 그래프를 통해 본인의 성적 확인
- 수강내역 관리: 과목 검색 및 등록, 재수강 반영
- 졸업 판정 확인: 영역별 충족 여부와 부족 항목 확인
- 마이크로전공 확인: 이수 현황과 부족 과목 확인
- 자료함: 파일 업로드, 다운로드, 삭제, 사용량 확인

## 기술 스택

- Frontend: Vanilla JavaScript, Vite, Nginx
- Backend: Java 17, Spring Boot, Spring Security, Flyway
- DataBase: PostgreSQL
- Infea: Docker, k3s, GitHub Actions, ArgoCD

## 프로젝트 구조

```text
.
├─ backend/     # API 서버
├─ frontend/    # 사용자 웹 화면
├─ infra/       # 배포/운영/DB 설정
└─ .github/     # CI/CD 워크플로우
```

## 주요 화면

- `/`: 로그인 및 진입 화면
- `/grad/`: 대시보드
- `/profile/`: 프로필 설정
- `/grad/courses/`: 수강내역 관리
- `/grad/status/`: 졸업 판정 상세 확인
- `/storage/`: 자료함
- `/error/`: 공통 에러 페이지

## 기타

- 기획 및 개발: 김현우
- 1인 개발 풀스택 포트폴리오 프로젝트입니다.
- 서비스 명이 변경되었습니다. `my-graduation-manager` -> `SKHU Track`

## 더 보기

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`infra/README.md`](infra/README.md)
