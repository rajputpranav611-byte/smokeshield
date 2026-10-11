# SmokeShield 🌿
### Yesterday’s Plan, Today’s Air

**SmokeShield turns changing environmental conditions into evidence-backed operational decisions for schools and facilities.**

Rather than simply displaying environmental information, SmokeShield helps an operator review an existing outdoor-activity plan against fresh evidence, compare alternatives, and understand when a human review is needed.

> **Important:** SmokeShield is a decision-support prototype, not a certified environmental monitoring, smoke-plume measurement, emergency-response, or safety-guarantee system.

## Why SmokeShield?

Environmental conditions can change overnight, while an activity plan made the previous evening may remain unchanged. A school or facility operator needs to know whether the current evidence still supports the plan—or whether it should be reviewed.

SmokeShield connects environmental context with an operational workflow:

**Observe → Forecast → Plan → Human Approval → Morning Verify → Act → Verify Outcome**

The goal is to make changes, uncertainty, and next steps easier to understand without allowing the software to silently make consequential decisions.

## Key features

- **Command Center:** A consolidated view of environmental context and plan status.
- **Air Corridor map:** Visualizes fire observations and modeled potential smoke-influence context.
- **Plan Studio:** Explores alternative activity schedules, such as delaying an outdoor activity or moving it indoors.
- **PlanGuard:** Compares a previously approved plan snapshot with a fresh assessment.
- **Evidence Audit:** Makes evidence-source status and limitations visible, with links between evidence and map context.
- **Deterministic replay scenarios:** Reproduces example conditions for repeatable demonstrations and testing.
- **Decision Receipt:** Copies or downloads a text summary of the available decision context and evidence limitations.

## PlanGuard decision states

| State | Meaning |
|---|---|
| `VERIFIED` | Available evidence supports the existing plan under the prototype's defined rules. |
| `WATCH` | Conditions changed and a review is recommended. |
| `ESCALATED` | The assessment indicates material deterioration and proposes a revised plan for human approval. |
| `DATA_GAP` | Critical evidence is missing or stale, so the system cannot confidently reassess the plan. |

### Conservative decision principles

- An apparent improvement does **not** automatically remove an existing precaution.
- A worsening assessment can propose a revised plan, but a person remains responsible for approving changes.
- Missing or stale evidence is surfaced explicitly; it is not treated as proof that conditions are safe.
- Replay scenarios are labeled as replay/simulated data and are not presented as live environmental measurements.

## Evidence sources and limitations

- **NASA FIRMS:** Active-fire and thermal-anomaly observations can help identify potential fire activity. A detection does not prove a particular fire type or establish that smoke reached a school.
- **Open-Meteo:** Weather information provides context for interpreting environmental conditions; it is not a direct measurement of smoke at a specific location.
- **Local air quality:** A local AQI provider is not configured in the current prototype. The application should report this data as unavailable rather than fabricate a reading.

The map's “potential smoke-influence corridor/window” is modeled context, **not a direct plume measurement**. SmokeShield does not guarantee environmental safety or claim validated exposure predictions.

## Screenshots

| Screen | Screenshot |
|---|---|
| Command Center |<img width="1894" height="957" alt="Screenshot 2026-10-11 231848" src="https://github.com/user-attachments/assets/243c2187-ba95-4489-8ca1-71d698c4dbc8" />

 PlanGuard comparison <img width="1644" height="953" alt="Screenshot 2026-10-11 232035" src="https://github.com/user-attachments/assets/86df265e-724f-4a0a-9b9a-9857464abee4" /> <img width="1652" height="895" alt="Screenshot 2026-10-11 232050" src="https://github.com/user-attachments/assets/d037587d-a4e7-4538-ab8f-b48498abe3a5" />

 Air Corridor and Evidence Audit  <img width="1652" height="881" alt="Screenshot 2026-10-11 232404" src="https://github.com/user-attachments/assets/9a336133-d0fa-47e4-9f47-2f7f424052ee" /> <img width="1652" height="894" alt="Screenshot 2026-10-11 232420" src="https://github.com/user-attachments/assets/3164604d-1e57-484d-ac8f-15be37ec9300" />

 Plan Studio / replay scenario  <img width="1672" height="893" alt="Screenshot 2026-10-11 232608" src="https://github.com/user-attachments/assets/9db850d3-1656-4d3d-a398-a98c98798d23" /> <img width="1666" height="893" alt="Screenshot 2026-10-11 232619" src="https://github.com/user-attachments/assets/61a68237-252e-48ef-b61c-efa578c7af68" />

## Architecture

The deployed backend components verified for this project include:

- **Amazon API Gateway HTTP API** — backend HTTP entry point.
- **AWS Lambda** — assessment and other application handlers, as deployed.
- **Amazon DynamoDB** — application state table (`SmokeShieldState`).

The repository also includes AWS SAM infrastructure definitions and supporting configuration for services such as Amazon Cognito, AWS Systems Manager Parameter Store, and Amazon EventBridge Scheduler. Confirm each service's actual deployment and configuration before describing it as active.

The Next.js frontend can run locally. Frontend hosting and end-to-end integration with the deployed AWS API must be verified separately.

### Request flow

```text
Next.js frontend
      |
      v
Amazon API Gateway HTTP API
      |
      v
AWS Lambda handlers
      |
      v
Amazon DynamoDB (SmokeShieldState)
```

This is a simplified backend view, not a complete security or deployment diagram.

## Tech stack

**Application**
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui and Lucide
- MapLibre GL
- Recharts
- Motion / GSAP and React Three Fiber components where used

**AWS / infrastructure**
- Amazon API Gateway HTTP API
- AWS Lambda (Node.js 22, as defined in the SAM template)
- Amazon DynamoDB
- AWS Serverless Application Model (SAM)

Other AWS services in the template should be treated as configured/deployed only after verification.

## Getting started

### Prerequisites

- Node.js and npm versions compatible with the repository.
- Git.
- For AWS deployment or live-provider testing: AWS CLI and AWS SAM CLI, appropriate non-root AWS credentials, and any required provider configuration.

### 1. Clone the repository

```bash
git clone https://github.com/rajputpranav611-byte/smokeshield.git
cd smokeshield
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Review the repository's environment example files and source configuration before setting variables. If an example file is available, copy it to the local environment file expected by the application and fill in only the values you need.

For live NASA FIRMS integration, configure a valid FIRMS MAP key in the appropriate local/AWS configuration. The AWS deployment template uses the SSM Parameter Store path:

```text
/smokeshield/dev/FIRMS_MAP_KEY
```

**Never commit API keys, access tokens, passwords, `.env` files, or other secrets.** Do not paste secrets into issues or public logs.

If provider credentials are not configured, use the app's supported local/replay mode and treat its output accordingly.

### 4. Run the development server

```bash
npm run dev
```

Open the local URL printed by Next.js, usually:

```text
http://localhost:3000
```

### 5. Run checks

Use the scripts defined in `package.json`. In this repository, the project checks have included:

```bash
npx vitest run
npm run lint
npm run build
```

If using AWS SAM, validate and build the infrastructure template from the repository root:

```bash
sam validate --lint --template-file template.yaml
sam build --template-file template.yaml
```

Test results depend on the current code and environment; run the commands yourself before relying on a previous result.

## AWS deployment notes

Infrastructure is defined in `template.yaml`. Review the template and deployment documentation before making changes.

Relevant project documents may include:

- `AWS_ARCHITECTURE.md`
- `AWS_DEPLOYMENT.md`
- `AWS_SECURITY.md`
- `AWS_COSTS.md`

Check which files are present in the repository before relying on these names.

**Deployment safety:**
- Do not use AWS root credentials for application deployment.
- Use a dedicated identity/role with the minimum permissions needed.
- Confirm API routes, authentication, CORS, environment variables, and data-source configuration.
- Keep scheduled jobs disabled until the workflow has been tested and their cost/behavior is understood.
- Monitor AWS billing and budgets. Costs depend on usage, region, and resource configuration; do not assume every component is free.

## Demo

- **Demo video:** Add your public or unlisted YouTube URL here.
- **Hosted application:** Add a public frontend URL only after the frontend is hosted and verified.
- **Backend API:** The API endpoint is a backend interface, not a substitute for a hosted dashboard.

If the frontend is running locally during the demo, state that clearly rather than describing the entire application as publicly hosted.

## Testing and replay scenarios

Replay scenarios are intended to help test the decision workflow under repeatable conditions, including unchanged plans, worsening conditions, improved conditions, and stale/missing evidence.

They demonstrate application behavior under defined scenarios. They do not establish real-world forecasting accuracy, prove exposure, or replace domain-expert validation.

## Known limitations and future work

- Configure and validate an appropriate local air-quality data provider.
- Verify frontend hosting and end-to-end integration with the deployed API.
- Verify the deployed status and configuration of supporting AWS services.
- Validate decision thresholds and evidence handling with environmental and school-safety experts.
- Evaluate the workflow using suitable real-world data and document its limitations.
- Improve accessibility, operational monitoring, and deployment documentation.

## Contributing

Issues and pull requests are welcome. For substantial changes, please open an issue first to discuss the proposed improvement. Never submit credentials or sensitive operational data.

## Disclaimer

SmokeShield is an experimental decision-support prototype. It is not a substitute for official air-quality advisories, local emergency guidance, professional environmental assessment, or decisions made by responsible school/facility personnel. Data availability, freshness, and quality can vary, and modeled context may be incomplete.

## Author

**Pranav Rajput**

- GitHub: [@rajputpranav611-byte](https://github.com/rajputpranav611-byte)
- Project: [SmokeShield](https://github.com/rajputpranav611-byte/smokeshield)

---

*Built for the WeMakeDevs × AWS Bharat Builds Tour 2026 — Environmental Hacks, Air track.*
