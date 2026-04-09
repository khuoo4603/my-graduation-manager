# SKHU Track Backend

`backend/`는 SKHU Track의 API 서버 디렉토리입니다.

## 주요 API

- 인증/계정: `/oauth2/**`, `/api/v1/auth/logout`, `/api/v1/account`
- profile: `/api/v1/profile`
- reference: `/api/v1/reference/**`
- course master / course: `/api/v1/course-masters`, `/api/v1/courses`
- graduation: `/api/v1/grad/status`, `/api/v1/grades/summary`, `/api/v1/micro-majors/status`
- storage: `/api/v1/storage/**`
- health: `/health`, `/health/ready`, `/health/db`

## 기술 스택

- Java 17
- Spring Boot
- Spring Security
- JDBC/JdbcTemplate
- PostgreSQL
- Flyway
