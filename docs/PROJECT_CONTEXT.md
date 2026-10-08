# SmokeShield — Complete Project Context / AI Handoff

## 1. Project identity

**Project name:** SmokeShield

**Environmental Hacks track:** Air

**Event:** WeMakeDevs × AWS Bharat Builds Tour — Environmental Hacks

**Hackathon dates:** October 8–11, 2026, online across India. Optional in-person build day at DTU Delhi on October 10. The event has three tracks: Air, Heat & Water, Waste & Energy.

**Primary objective:** Build a highly polished, technically credible environmental decision-support system that has a strong chance of winning the Air track.

**Core positioning:**

> SmokeShield turns changing environmental conditions into evidence-backed operational decisions for schools and facilities.

SmokeShield is **not** a generic AQI dashboard, not a pollution chatbot, and not just a fire map.

The central product idea is:

> **Forecast → Plan → Human Approval → Morning Verification → Action → Outcome Verification**

The key problem:

Environmental data already exists, but school/facility operators still have to decide what to do. A forecast can also become wrong before the actual event happens. SmokeShield connects environmental evidence to a concrete operational plan and then verifies that plan again before the bell.

---

# 2. Core user

### Primary user

School principal / school administrator / facility manager.

### Secondary users

- Operations/admin staff
- Teachers/staff receiving approved instructions
- Parents receiving simplified evidence/share cards

The product should be designed around the primary operator, not around environmental researchers.

---

# 3. Core problem statement

A principal may know that AQI is elevated, but an AQI number alone does not answer:

- Should an outdoor assembly be moved?
- Should PE become an indoor activity?
- Should outdoor sports be postponed?
- Is tomorrow's approved plan still appropriate this morning?
- Why did the system recommend a particular time?
- What changed since the plan was approved?
- What happens when a data source becomes stale?
- Did the decision actually work?

SmokeShield answers those operational questions.

---

# 4. Core product loop

## OBSERVE

Collect environmental signals.

## FORECAST

Estimate a location-specific potential smoke-influence window.

## PLAN

Test alternative activity schedules.

## APPROVE

An authorized human approves a plan.

## MORNING VERIFY

PlanGuard checks whether the approved plan still matches the latest evidence.

## ACT

Publish the approved/revised operational instruction.

## VERIFY OUTCOME

Compare the prediction/plan against observed environmental conditions afterward.

This is the central story of the product.

---

# 5. The most important feature: PlanGuard

### Name

**PlanGuard — Morning Verification**

Core statement:

> SmokeShield does not stop at forecasting risk. PlanGuard verifies the approved plan against the latest morning evidence before school starts.

Scenario:

### Evening

Principal approves:

- Assembly moved 08:30 → 10:00
- PE → Indoor
- Outdoor sports → Postponed

SmokeShield stores:

- plan version
- approval time
- approver
- environmental evidence snapshot
- risk snapshot
- policy version

### Morning

At 06:45/07:00, EventBridge triggers PlanGuard.

PlanGuard:

1. Fetches newest available environmental evidence.
2. Recalculates risk.
3. Compares current conditions with the evidence used for approval.
4. Determines whether the approved plan still matches.
5. Produces one of four states:
   - VERIFIED
   - WATCH
   - ESCALATED
   - DATA GAP

### Important safety rule

If conditions improve, SmokeShield does **not** automatically relax a precaution.

It says:

> Conditions improved — review recommended. The existing precaution remains active.

If conditions worsen:

> Revised plan drafted — principal review required.

If data is stale/missing:

> Confidence downgraded. Existing conservative precaution retained.

The system is decision support, not an autonomous authority.

---

# 6. Tier 1 core features

## A. Smoke Corridor Map + Time Scrubber

Hero visual.

Shows:

- satellite fire detections
- wind vectors
- potential smoke-influence corridor
- school/facility
- air-quality monitoring stations
- time scrubber

Timeline example:
06:30 → 07:00 → 07:30 → 08:00 → 09:00 → 10:00 → 11:00

Dragging the timeline changes:

- corridor visualization
- wind direction
- risk window
- school state

Important wording:
**Potential Smoke-Influence Corridor**

Do not imply that the visual is a direct measured plume.

Add:

> Modeled influence · not a direct plume measurement

---

## B. “What if we move assembly?” planner

The user changes:
08:00 → 11:00

The application recomputes:

- overlap with the estimated influence window
- recommended time
- confidence
- comparative result

Example:

> Recommended: 10:00 AM
> Lower predicted overlap under current evidence.

Do not fabricate precise percentages such as:

- 90% exposure avoided
- 85% reduction
  unless backed by real evaluation.

Prefer:

- estimated influence overlap
- relative risk
- confidence
- evidence freshness

---

## C. Predict → Act → Verify

Track the full operational lifecycle.

Example:
06:30 prediction
07:02 verification
07:31 approval
08:00 notification
09:40 observed outcome

Compare:
Predicted window vs observed window.

Avoid reducing everything to one misleading “AI accuracy” number.

---

## D. Historical Backtest

Replay several historical days.

Goal:
Answer the judge question:

> “How do you know this works?”

Show:

- forecast
- actual/latest evidence
- simulated recommendation
- PlanGuard behavior
- result classification

Use transparent categories such as:

- Correct escalation
- Correct precaution
- Conservative response
- Missed escalation
- Data-gap handling

Never invent an accuracy percentage.

---

# 7. Tier 2 features

## A. Break the Model

Interactive failure scenarios:

- wind shifts +30°
- new fire appears
- air-quality feed goes down
- weather becomes stale
- two sources conflict

The UI should react live.

Example:

> Weather source unavailable. Confidence downgraded.

Example:

> Conflicting evidence detected. Human review requested.

A strong design principle:
The system must be willing to say **“I cannot confidently recommend an action.”**

---

## B. Evidence Drawer

Every recommendation should answer:

> Why?

Evidence timeline:
06:14 — NASA FIRMS — new fire detections
06:21 — Weather — wind
06:27 — Air Quality — AQ trend
06:30 — Risk Engine — corridor overlap
06:31 — Planner — recommendation
06:31 — Cedar — authorization

Every evidence item:

- source
- timestamp
- freshness
- value
- effect on decision

---

## C. Data Health Strip

Small persistent source health indicators:

NASA FIRMS ●
Weather ●
CPCB/OGD AQ ●

Show:

- freshness
- last update
- confidence impact

Do not fake live data.

---

## D. Cedar Authorization

Cedar controls authorization; it does NOT calculate environmental risk.

Correct separation:

Environmental data
→ Risk Engine
→ recommendation
→ Cedar
→ may this person perform this action?

Use typed numeric context:

- riskScore
- confidenceScore
- evidenceFreshnessMinutes
- planApproved
- dataConflict

Do not compare strings like:
confidence >= "Medium"

Use numeric values.

Example conceptual policy:

- principal may publish an approved plan if evidence is sufficiently fresh and confidence is sufficient
- relaxing an approved precaution can be forbidden when evidence is stale or conflicting

Cedar should protect actions such as:

- ReviewPlan
- ApprovePlan
- PublishPlan
- CreateEscalation
- RelaxPrecaution

---

# 8. Tier 3 / demo wow features

## A. Voice Warden

A 20-second morning briefing for the principal.

Example:

> “Good morning. Today’s approved outdoor plan is under review. Seven recent satellite fire detections are upwind, with southeast winds. SmokeShield recommends keeping the 10:00 assembly schedule. Say ‘Approve’ to publish the revised plan.”

Architecture possibilities:

- Amazon Polly = text-to-speech
- Amazon Connect = phone/telephony layer
- Amazon Transcribe = speech-to-text when needed
- SNS = SMS, not WhatsApp
- WhatsApp would require a separate WhatsApp Business/Cloud API integration

For the hackathon, one working voice route is enough.

---

## B. IoT Air Purifier Pre-Sentry

Optional physical demo:
ESP32 + PM sensor + fan/purifier prototype.

Flow:
Potential smoke influence approaching
→ AWS IoT Core
→ device desired state
→ fan ON
→ sensor reports state

Important:
Do not claim to control a real school's HVAC system.

Use a physical prototype.

---

## C. Parent Share Card

Generate a simple shareable card:

> School outdoor assembly shifted from 08:30 to 10:00 because current environmental evidence indicates a higher potential smoke-influence window.

Include:

- reason
- new activity time
- evidence sources
- timestamp

Do not dump technical risk scores onto parents.

---

# 9. Planned UI / information architecture

## Public

1.  Landing / Product Hero
2.  Explore / Judge Demo

## Auth

3.  Sign In

## Product

4.  Command Center
5.  Air Corridor
6.  Plan Studio
7.  PlanGuard
8.  Evidence
9.  Replay
10. Backtest Lab
11. Decision Log
12. Data & Policy

Optional supporting interface: 13. Voice Warden briefing preview drawer/modal

The actual hackathon-critical screens are:
Command Center
Air Corridor
Plan Studio
PlanGuard
Evidence
Replay

---

# 10. Global UI / UX system

## Navigation

Desktop:

- persistent left sidebar

Application top bar:

- school/location
- date/time
- PlanGuard status
- alerts
- user

Marketing site:

- compact top navigation

Do not mix marketing navbar and product sidebar.

## Visual identity

Dark environmental operations console.

Base:

- charcoal / near-black
- subtle atmospheric gradients
- restrained semantic colors
- thin borders
- small/medium radius
- minimal shadow

Do NOT use:

- excessive glassmorphism
- neon cyberpunk everywhere
- giant rounded cards
- generic AI-gradient backgrounds
- decorative charts
- excessive 3D effects

Typography:

- Geist / Inter
- Space Grotesk for major headings
- JetBrains Mono for telemetry and technical values

Color semantics:

- green = verified
- amber = watch
- orange/red = escalation
- muted slate = data gap
- cool blue = informational telemetry

---

# 11. Page descriptions

## Landing

Hero:
“The air can change before the school bell does.”

Visual:
fire → wind → potential smoke influence → school → decision

Sections:

- Detect
- Decide
- Verify
- full lifecycle
- built for decisions, not dashboards
- demo CTA
- evidence/source footer

India-focused examples only:
Ahmedabad / Vadodara / Delhi / Punjab / Haryana etc.

Do not use US school examples.

---

## Command Center

Answers:

- What is happening?
- Is my current plan valid?
- What should I do?

Priority:
Plan Status → Map → Recommendation → Evidence

---

## Air Corridor

Map is dominant.

Shows:
fire detections
wind
potential corridor
school
monitoring station
timeline

---

## Plan Studio

Main interaction:
“What if we move assembly?”

Schedule + risk curve + slider + before/after comparison.

---

## PlanGuard

Signature screen.

Main composition:
YESTERDAY’S APPROVED EVIDENCE
vs
TODAY’S LATEST EVIDENCE

Then:
VERIFIED / WATCH / ESCALATION / DATA GAP

Then:
new recommendation
reason
review action

---

## Evidence

Forensic/case-file design.

Every recommendation is traceable to evidence.

---

## Replay

Replay the full morning:
prediction → PlanGuard → changes → approval → verification.

Map state changes as timeline moves.

---

## Backtest Lab

Historical scenarios.

Avoid misleading “AI accuracy” language.

---

## Decision Log

Audit trail:
timestamp
event
actor
action
status
policy
evidence snapshot

---

## Data & Policy

Data source health
freshness
policy thresholds
notification settings
audit settings

---

# 12. Data sources

Candidate sources:

### NASA FIRMS

Active fire / thermal anomaly observations.

Important:
A FIRMS detection is a satellite fire/thermal-anomaly observation, not automatically proof of a crop fire.

FIRMS near-real-time global data can have latency; do not label it universally “instantaneous.”

### CPCB / OGD

Air-quality observations where available.

Show:
station
observation time
pollutant
value
data age

### Weather / wind

Use a suitable provider. IMD is ideal where access is practical, but do not make the entire hackathon dependent on production API access.

Use a provider abstraction:
WeatherProvider

- IMDProvider
- CachedProvider
- DemoReplayProvider

Label cached/replay data honestly.

---

# 13. Environmental risk model philosophy

Do NOT let the LLM decide environmental risk.

Deterministic/domain code calculates:

- distance
- direction
- wind alignment
- recency/freshness
- fire density
- air-quality trends
- temporal overlap
- confidence

The result should be something like:
riskScore
confidenceScore
riskWindow
evidenceIds

The LLM/agent can:

- explain
- summarize
- answer “why”
- orchestrate tools

It should not invent the environmental measurements.

---

# 14. Agent architecture

Possible Strands agent:

EnvironmentalOpsAgent

Tools:
get_air_quality()
get_active_fires()
get_weather()
calculate_risk_window()
simulate_schedule()
explain_evidence()
request_authorization()
get_plan_status()
run_plan_guard()

Agent role:
Orchestrate the workflow and explain results.

Risk engine role:
Calculate environmental risk.

Cedar role:
Authorize consequential actions.

Step Functions role:
Coordinate PlanGuard and action workflow.

---

# 15. Proposed AWS architecture

Frontend:
Next.js + TypeScript
Tailwind
shadcn/ui
MapLibre
React Three Fiber / Three.js
Motion
GSAP
Recharts

AWS:
Amplify or CloudFront
API Gateway
Lambda
DynamoDB
S3
EventBridge
Step Functions
Cedar
Bedrock
Strands
SNS / SES
CloudWatch
IoT Core (optional)
Amazon Connect (optional Voice Warden)

High-level flow:

Environmental APIs
→ EventBridge
→ Lambda ingestion
→ DynamoDB
→ Risk Engine
→ recommendation
→ Next.js Console

For PlanGuard:
EventBridge Scheduler
→ Lambda
→ fetch latest evidence
→ Risk Engine
→ compare against approved plan
→ Cedar
→ Keep / Watch / Escalate / Data Gap
→ notification
→ audit log

---

# 16. Recommended frontend stack

Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide
MapLibre GL
React Three Fiber
Three.js
Motion
GSAP
Recharts

Do not use every library simply because it is available.

Use:

- Three.js/R3F for meaningful atmospheric/3D visualizations
- GSAP for cinematic sequences
- Motion for everyday React state/interaction animation
- MapLibre for geospatial visualization

---

# 17. Recommended backend approach

For clean separation:

Local development:
Python + FastAPI for domain/API development if useful.

Production:
AWS API Gateway + Lambda for serverless deployment.

Use Python for:

- risk calculations
- geospatial processing
- data ingestion
- evaluation scripts

Use TypeScript for:

- UI
- map
- interaction
- simulation/replay client logic where suitable

---

# 18. TasteSkill + Stitch workflow

TasteSkill is used as the design discipline, not as a component library.

Recommended workflow:

TasteSkill
→ design rules
→ DESIGN.md
→ Stitch
→ UI iteration
→ Figma/prototype
→ production frontend

For Stitch:

- use the SmokeShield DESIGN.md as the source of truth
- use page-specific prompts
- do not repeat the whole design system in every prompt

TasteSkill has a dedicated `stitch-skill` intended for Stitch. The general frontend design skill is more appropriate later when working with coding agents.

---

# 19. DESIGN.md

There is already a project-specific SmokeShield DESIGN.md containing:

- design tokens
- typography
- spacing
- color roles
- component rules
- map rules
- PlanGuard interaction rules
- evidence UX
- animation principles
- anti-generic UI constraints

Use that file with Stitch and later with coding agents.

---

# 20. Important credibility rules

Never fabricate:

- AQI values
- fire counts
- source freshness
- prediction accuracy
- “90% exposure avoided”
- “85% reduction”
- ±8% error
- regulatory compliance
- EPA alignment
- live sensor state

If demo data is simulated/replayed, label it:
SIMULATION
or
HISTORICAL REPLAY

If a source is stale, show that.

If two sources conflict, show that.

If confidence is insufficient, say so.

A mature system is allowed to refuse a recommendation.

---

# 21. What the hackathon judges care about

Environmental Hacks judging:

1. Idea & impact
2. Built on AWS
3. Design & usability
4. Execution
5. Demo video

The rules state that:

- the project must use an AWS service or AWS open-source tool to be prize eligible
- old projects cannot be passed off as new
- actual project work starts when the hackathon opens
- the public repo, demo video and short writeup are the submission
- the video is up to 3 minutes
- there is no live demo/call
- judges score what is submitted and shown

Therefore:
A working narrow system is better than a huge unfinished platform.

---

# 22. Winning/demo strategy

The strongest 3-minute story:

0:00–0:15
Problem:
“The principal knows the AQI. The hard question is what to do before the bell.”

0:15–0:40
Show fire detection + wind + school + potential smoke influence.

0:40–1:05
Open Plan Studio.
“What if we move assembly?”

1:05–1:25
Move the slider.
Recommendation changes.

1:25–1:45
Open Why/Evidence.

1:45–2:10
Show PlanGuard.
Yesterday’s plan vs this morning.

2:10–2:30
Conditions worsen.
PlanGuard creates revised plan.

2:30–2:45
Principal approves.

2:45–2:55
Verification/outcome.

2:55–3:00
Show AWS architecture briefly.

Do not spend 45 seconds reading the architecture.

---

# 23. The signature sentence

The product should be explainable as:

> **“Most environmental systems stop at prediction. SmokeShield verifies whether the approved plan still fits reality before the bell.”**

Alternative:

> **“We don't just tell a school that the air changed. We help it decide what to change—and check the decision again before the day starts.”**

---

# 24. What NOT to build

Do not turn SmokeShield into:

- a generic AQI dashboard
- an environmental chatbot
- a fire map
- a generic school management system
- a giant climate super-app
- a fake autonomous safety authority

Do not add dozens of charts.

Do not integrate 15 AWS services just for presentation.

Do not build real-school HVAC control unless a small physical prototype is easy.

---

# 25. Build priority

## Must work

1. Command Center
2. Air Corridor
3. Plan Studio
4. Risk engine
5. PlanGuard
6. Evidence
7. approval/audit flow

## Strong addition

8. Backtest
9. Replay
10. Cedar

## Demo wow

11. Voice Warden
12. IoT prototype
13. Parent share card

If time gets tight:
Cut Tier 3 before cutting the core workflow.

---

# 26. AWS account situation

The user has an older AWS account rather than a brand-new account.

Current AWS documentation says the new Free Tier experience provides new customers up to $200 in credits, with $100 initially and up to another $100 through onboarding activities. The new Free plan lasts up to six months or until the credits are used. This applies to new customers/accounts.

For older accounts created under the previous Free Tier model, AWS documentation says the 12-month free-service eligibility is tied to first account activation, and after that period the old free-tier eligibility does not extend; Always Free offers can continue, while normal rates can apply.

Therefore:

- Do NOT assume the older account has the new $200 credits.
- Check AWS Billing/Free Tier/credits before deploying.
- Check whether the account is still within its old 12-month Free Tier window or is now pay-as-you-go.
- Set billing alerts/budgets before using paid services.
- Use the smallest serverless architecture possible.
- Avoid EC2/GPU unless absolutely necessary.
- Build locally with AWS open-source tools while the account problem is being resolved.

Environmental Hacks does NOT state that the AWS account must be newly created. It says projects can use AWS cloud services or AWS open-source tools and that prize eligibility requires at least one AWS service or AWS open-source tool.

The organizer's broader Bharat Builds materials also describe AWS hackathon credits for teams/participants, but the current Environmental Hacks page should be treated as the primary event reference for the current stop.

Practical fallback:
Build and test locally using:

- AWS SAM CLI
- Cedar
- Strands
- local/mock data
- a replay provider

Then deploy only the final working path to the available AWS account.

---

# 27. Project identity in one paragraph

SmokeShield is an India-focused environmental operations platform for schools. It combines satellite fire detections, weather/wind signals and local air-quality observations to estimate potential smoke-influence windows around a school and help a principal choose safer outdoor schedules. Its signature feature, PlanGuard, verifies an already-approved plan against fresh morning evidence before the school day starts. The platform exposes evidence and freshness, uses Cedar to authorize consequential actions, keeps a decision log, supports historical replay/backtesting, and can optionally use voice and IoT integrations. The goal is not to produce another environmental dashboard; it is to turn environmental evidence into a human-approved decision and then verify that decision against reality.
