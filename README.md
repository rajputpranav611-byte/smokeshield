# SmokeShield

SmokeShield is an environmental operations decision system for schools and facilities. It converts environmental evidence (active fires, wind, AQI) into explainable, deterministic operational decisions.

## Architecture

SmokeShield is composed of:
1.  **Frontend (Next.js + TypeScript)**: Provides the Command Center, Plan Studio (what-if planner), Air Corridor visualization, and PlanGuard statuses.
2.  **Backend (AWS Serverless)**:
    *   **API Gateway**: Exposes endpoints protected by Cognito JWT authorization.
    *   **Lambda Functions**:
        *   `AssessmentFunction`: Evaluates environmental risks deterministically using `Open-Meteo` and `NASA FIRMS` data (or replay scenarios).
        *   `PlanFunction`: Manages plans and approvals, storing data in DynamoDB.
        *   `PlanGuardFunction`: Morning verification job invoked by EventBridge Scheduler.
    *   **DynamoDB**: `SmokeShieldState` table stores plans, approvals, and verification history securely using conditional writes to prevent conflict.
    *   **Cognito**: Secures the API by validating `Principal`, `SchoolOperator`, or `Admin` JWT claims.

## Setup Instructions

### Prerequisites
*   Node.js v22.x
*   AWS CLI and AWS SAM CLI (if deploying to AWS)
*   Docker (optional, for local SAM testing)

### Local Development (Frontend)
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000) to view the Command Center.

### Environment Variables
For local testing without live AWS dependencies, the frontend fetches replay data by default.
For live data, create a `.env.local` (do NOT commit this file):
```
# Only required if deploying/testing live AWS handlers locally
FIRMS_MAP_KEY=your-nasa-firms-key
```
Note: In AWS, secrets are securely retrieved from SSM Parameter Store (`/smokeshield/dev/FIRMS_MAP_KEY`).

## Tests
SmokeShield uses `vitest` for deterministic unit and integration testing without calling live AWS services or external APIs.
To run the test suite:
```bash
npx vitest run
```
To run lint and build:
```bash
npm run lint
npm run build
```

## Replay Mode Instructions

SmokeShield includes a deterministic REPLAY mode that requires no external API keys or live network requests.
1.  Navigate to the **Plan Studio** (`/plan-studio`).
2.  Select a "What-If" scenario (e.g., "Baseline Overlap" or "Wind Shift").
3.  Adjust the time controls for the Outdoor Assembly.
4.  Click **Recalculate Assessment**. The system deterministically recalculates the smoke influence corridor and confidence score using the static replay data.

## Deployment Prerequisites
*   Do **NOT** deploy using a root AWS account.
*   The `template.yaml` defines the infrastructure.
*   Run validation and build before deploying:
    ```bash
    sam validate --lint --template-file template.yaml
    sam build --template-file template.yaml
    ```
*   After deployment, an Administrator must manually create the first users in the Cognito User Pool and assign them to the `Principal`, `SchoolOperator`, or `Admin` groups using the AWS CLI or Console.
*   The `PlanGuardSchedule` is currently `DISABLED` by default to prevent unexpected invocations. It must be manually enabled.

## Known Limitations
*   The Air Corridor and PlanGuard UI pages currently show placeholder structural elements. The full mapping visualization (MapLibre/R3F) is pending.
*   User provisioning is entirely manual post-deployment.
*   The `REPLAY` mode uses static datasets to ensure deterministic hackathon demonstrations.

## Manual End-to-End Test Checklist
- [x] Run `npx vitest run` and ensure 90/90 tests pass.
- [x] Run `npm run lint` and `npm run build` without failure.
- [x] Start `npm run dev` and open the Command Center. Verify the mock Command Center loads successfully and shows deterministic REPLAY data without crashing.
- [x] Navigate to Plan Studio. Adjust times and change scenarios. Click "Recalculate Assessment" and verify the confidence score and overlap minutes change dynamically.
- [x] Verify API Gateway in `template.yaml` requires `CognitoAuthorizer` for all routes.
- [x] Verify `PlanGuardSchedule` in `template.yaml` is `State: DISABLED`.

## Demo Shot List (3 Minutes)
1. **Command Center (0:00 - 1:00)**: Show the dashboard loaded with deterministic data. Explain how SmokeShield interprets data from NASA FIRMS and Weather providers, displaying confidence scores and overlap minutes. Point out the Data Health checks.
2. **Plan Studio (1:00 - 2:00)**: Switch to the Plan Studio. Demonstrate the "What-If" planner. Change the scenario to "Wind Shift", adjust the time of the Outdoor Assembly, and click Recalculate. Explain how the deterministic engine evaluates the scenario instantly without live network dependencies.
3. **PlanGuard Concept (2:00 - 3:00)**: Explain the PlanGuard morning verification rule. Show how worsening conditions (e.g., Overlap Minutes increasing) automatically triggers an `ESCALATED` status requiring human principal approval, while improving conditions preserve the approved plan (`VERIFIED`). Mention the AWS Serverless architecture backing this security.
