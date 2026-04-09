# SKHU Track Infra

`infra/`는 SKHU Track의 배포와 운영 설정 디렉토리입니다.

## 구성

- `argocd/apps/`: backend/frontend dev·prod 설정
- `db/postgres/`: 로컬 PostgreSQL Compose 설정
- `k8s/backend/`: backend - dev, prod 설정
- `k8s/frontend/`: frontend - dev, prod 설정

## 기술 스택

- Docker
- k3s
- GitHub Actions
- GHCR
- ArgoCD
