# My Graduation Manager

(대학생을 위한 졸업요건 자동 판정 및 졸업 자료 관리 시스템)
26년도 풀스택 개발 역량 강화를 위한 개인 사이트 프로젝트임.

학과·학번별로 상이한 대학 졸업요건을 학생의 수강 이력과 취득 학점을 기반으로 **졸업 가능 여부를 자동 판정**하는 시스템임.

---

## 주요 기능

- 학과별 졸업요건 템플릿 기반 졸업 가능 여부 자동 판정
- 졸업 관련 문서를 관리하는 개인 자료함(Locker)

---

## 기술 스택

### Backend

- Java 17
- Spring Boot
- Spring Security
- JdbcTemplate

### Frontend

- Vanilla JavaScript (MPA)
- Nginx (정적 파일 서빙)

### Database

- PostgreSQL

### File Storage

- Synology NAS (NFS 연동)

### Infrastructure

- Docker
- Kubernetes (k3s)
- Traefik Ingress
- GitHub Actions (CI/CD)

---

## 저장소 구조

my-graduation-manager/
├─ backend/ # Spring Boot API 서버
├─ frontend/ # 정적 MPA 프론트엔드
└─ infra/ # Docker, Kubernetes, NAS, DB 설정
