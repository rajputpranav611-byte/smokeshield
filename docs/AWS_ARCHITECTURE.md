# AWS Architecture

## Overview
SmokeShield uses a serverless AWS backend designed around deterministic environmental verification.

## Core Components
- **API Gateway HTTP API**: Entry point for API requests.
- **Assessment Lambda**: Serves `POST /assessment`. Reuses the domain's Environmental Evidence Orchestrator.
- **Plan Lambda**: Serves `POST /plans`, `GET /plans/{planId}`, `POST /plans/{planId}/approve`. Uses JWT-like mocked authorization.
- **PlanGuard Lambda**: Validates plans every morning using deterministic logic. Triggered by EventBridge.
- **DynamoDB (StateTable)**: Single-table design (`PAY_PER_REQUEST`). Stores Plans, Approvals, and Verifications.
- **SSM Parameter Store**: Securely stores `FIRMS_MAP_KEY` and passes it via in-memory caching to Lambda.

## EventBridge Scheduler
Configured for `06:45 Asia/Kolkata` daily. The schedule invokes PlanGuard. It is disabled by default for safety.
