<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://github.com/AliSaleemHasan/NowHere-frontend/blob/master/assets/images/icon.png" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A Social Media APP Built with <a href="http://nodejs.org" target="_blank">Nest JS</a> framework for knowing what's up nearby.</p>
    <p align="center">

</p>

## Description

This is a minimalistic Social Media Application that helps people know what's happening nearby in real-time.
People can see what others posted (from their camera feeds) and know if there's something lost, a hidden gem, or a promotion happening nearby.

---

## Project Setup

### Install Dependencies
```bash
pnpm install
# for specific service
pnpm install --filter [service name]
```

### Local Setup
```bash
# development locally with docker
docker compose -f docker-compose.dev.yml up
# start deployment like server
docker compose up
# if you prefer kubernetes locally (with kubectl)
kubectl create -f k8s/secrets
kubectl create -f k8s
```

---

## Cloud Providers & Secrets Management (Strategy Pattern)

The backend uses a **Strategy Pattern** for both **Secret Management** and **Cloud Storage**, allowing you to switch between cloud providers (Google Cloud, AWS, or local environment) without changing any application code.

### 1. Secrets Management (`SECRETS_PROVIDER`)
Supported values: `gcp` | `aws` | `env` (default: auto-detected or `env` for local dev).

#### Working Locally with Cloud Secrets (Without Duplicating `.env` Files)
You **do not** need to copy cloud keys into every microservice `.env` file. You can use your machine's global developer credentials:

- **Google Cloud Secret Manager (GCP)**:
  ```bash
  # 1. Login with Application Default Credentials (ADC) once:
  gcloud auth application-default login

  # 2. Set your default project:
  gcloud config set project your-gcp-project-id
  ```
  The `@google-cloud/secret-manager` library will automatically authenticate via ADC (`~/.config/gcloud/`).

- **AWS Secrets Manager**:
  ```bash
  # Configure your AWS CLI credentials once:
  aws configure
  ```
  The AWS SDK automatically reads your credentials from `~/.aws/credentials`.

- **Single Root `.env` Option**:
  Alternatively, define shared environment variables in a single `.env` file in the repository root (`/backend/.env`):
  ```env
  SECRETS_PROVIDER=gcp
  GCP_PROJECT_ID=your-gcp-project-id
  # OR for AWS:
  # SECRETS_PROVIDER=aws
  # AWS_REGION=us-east-1
  ```

---

### 2. Cloud Storage (`STORAGE_PROVIDER`)
Supported values: `aws` (AWS S3 / MinIO / R2) | `gcp` (Google Cloud Storage) | `minio`.

- **Direct Presigned Uploads**: Clients request presigned URLs from the backend and upload media directly to S3/GCS.
- **Service Isolation**: Only the `storage` microservice requires S3/GCS credentials. All other microservices (`users`, `snaps`, `gateway`, `authentication`) communicate with `storage` exclusively over gRPC and do not require bucket credentials.

---

## Run Tests

```bash
# Run all test suites
pnpm test

# For specific service via Nx
pnpm nx test users
pnpm nx test snaps
pnpm nx test storage
pnpm nx test authentication
pnpm nx test gateway
```

---

## Build

```bash
# Build all packages & services
pnpm nx run-many --target=build --all
```

---

## Stay in Touch

- Author - [Ali Hasan](https://www.linkedin.com/in/ali-saleem-hasan/)
