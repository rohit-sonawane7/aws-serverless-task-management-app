# Task Management API (Serverless + AWS + TypeScript)

A **serverless Task Management API** built with **AWS Lambda, API Gateway, DynamoDB, S3, Step Functions, and Cognito-ready JWT auth**.
Developed in **TypeScript** with local testing via **LocalStack**.

---

## Features

* CRUD operations on tasks (`POST`, `GET`, `PUT`, `DELETE`)
* `PATCH /tasks/:id/status` → update task status + trigger Step Functions workflow
* Task attachments stored in **S3**
* Data stored in **DynamoDB**
* JWT-based authentication (offline) / Cognito-ready (AWS deploy)
* **Zod validation** for input payloads
* **Vitest** unit & integration tests
* Local development with **serverless-offline** + **LocalStack**

---

## Tech Stack

* **AWS Lambda** (Node.js 18, TypeScript)
* **API Gateway**
* **DynamoDB**
* **S3**
* **Step Functions**
* **Serverless Framework v3**
* **LocalStack (Docker)** for local AWS services
* **Vitest + Supertest** for testing
* **Zod** for input validation

---

##  Project Structure

```
src/
  handlers/       # Lambda functions
  services/       # DynamoDB, S3, Step Functions helpers
  utils/          # Response helpers, JWT utils
  validation/     # Zod schemas
tests/            # Vitest unit & integration tests
serverless.yml    # Infrastructure as code
docker-compose.yml# LocalStack config
bootstrap-local.sh# Bootstrap script for LocalStack
```

---

## ⚡ Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/rohit-sonawane7/aws-serverless-task-management-app.git
cd aws-serverless-task-management-app/
run shell script file to compete setup and install dependencies and docker-compose containers
bash setup.sh
```

### 2. Start LocalStack & Serverless Offline

```bash
npm run localstack
npm run bootstrap-local
npm run dev
```

API will be available at:
[http://localhost:3000/dev](http://localhost:3000/dev)

---

##  Authentication

* **Locally:** uses JWT signed with `mysecret`
* **Generate token:**

  ```bash
  npx ts-node generate-jwt.ts
  ```
* Add token in Postman / curl:

  ```
  Authorization: Bearer <jwtToken>
  ```

---

## API Endpoints

### Create Task

**POST** `/tasks`

```json
{
  "title": "Finish assignment",
  "description": "Complete serverless API project",
  "status": "pending",
  "attachment": true
}
```

### List Tasks

**GET** `/tasks`

### Get Task by ID

**GET** `/tasks/{id}`

### Update Task

**PUT** `/tasks/{id}`

```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

### Delete Task

**DELETE** `/tasks/{id}`

### Update Task Status

**PATCH** `/tasks/{id}/status`

```json
{
  "status": "in-progress"
}
```

---

## Testing

Run unit + integration tests:

```bash
npm run test
```

**Coverage includes:**

* Zod schema validation
* Handlers (unit tests)
* API integration tests (with supertest + serverless-offline)

---

## ☁️ Deployment (AWS)

Deploy with:

```bash
npm run deploy
```

This will create:

* DynamoDB table
* S3 bucket
* Step Functions state machine
* API Gateway routes
* Lambda functions

---

## Tools

* **Postman Collection** → `TaskManagementAPI.postman_collection.json`
* **JWT Generator** → `generate-jwt.ts`

---

## Author

Built for **assignment/interview demonstration**.
Designed for **scalability, security, and testability**.
