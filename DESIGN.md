---
version: alpha
name: SmokeShield Operations Design System
description: A restrained dark environmental operations interface for evidence based air safety decisions in schools and facilities.
colors:
  canvas: "#0B0F12"
  panel: "#11171C"
  panel-elevated: "#172027"
  border: "#28323A"
  border-strong: "#3A4751"
  text-primary: "#F3F6F8"
  text-secondary: "#AAB5BE"
  text-muted: "#73808A"
  primary: "#A6E3B5"
  primary-strong: "#7FD19A"
  info: "#88BFFF"
  verified: "#76D39A"
  watch: "#F4C96B"
  escalated: "#FF8A65"
  danger: "#FF6B6B"
  data-gap: "#7D8892"
  map-fire: "#FF6B4A"
  map-corridor: "#A6E3B5"
  map-school: "#F3F6F8"
typography:
  display-xl:
    fontFamily: "Space Grotesk"
    fontSize: "56px"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  display-lg:
    fontFamily: "Space Grotesk"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  heading-lg:
    fontFamily: "Space Grotesk"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  heading-md:
    fontFamily: "Inter"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body-md:
    fontFamily: "Inter"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  body-sm:
    fontFamily: "Inter"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: "Inter"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.07em"
  mono:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"
components:
  app-shell:
    sidebar-width: "248px"
    topbar-height: "64px"
    content-max-width: "1600px"
    content-padding: "24px"
  primary-button:
    background: "{colors.primary}"
    text: "{colors.canvas}"
    radius: "{rounded.sm}"
  secondary-button:
    background: "transparent"
    text: "{colors.text-primary}"
    border: "{colors.border-strong}"
    radius: "{rounded.sm}"
  panel:
    background: "{colors.panel}"
    border: "{colors.border}"
    radius: "{rounded.md}"
  elevated-panel:
    background: "{colors.panel-elevated}"
    border: "{colors.border}"
    radius: "{rounded.md}"
  input:
    background: "{colors.panel}"
    border: "{colors.border-strong}"
    radius: "{rounded.sm}"
  status-badge:
    radius: "{rounded.pill}"
  timeline:
    rail: "{colors.border-strong}"
    active: "{colors.primary}"
---

# SmokeShield Design System

## Overview

SmokeShield is an environmental operations console, not a generic air quality dashboard. Its visual language should feel calm under pressure, evidence driven, precise and trustworthy. The primary audience is a school principal or facility manager who needs to understand current conditions, decide whether an approved plan is still appropriate, and act without studying a complex analytics interface.

The interface should feel closer to a mission control product, incident console or premium scientific instrument than a consumer weather app. The emotional goal is confidence through clarity, not confidence through decoration.

The product has five recurring questions:

1. What is happening?
2. Is my current plan still valid?
3. What should I do?
4. Why?
5. What happened afterward?

The visual hierarchy must follow those questions. Environmental maps, timelines and evidence states are the main visual language. Charts exist only when they support a decision.

Use a dark theme for the product application. The dark canvas allows smoke, wind vectors and environmental state colors to become visually legible without turning the product into a neon cyberpunk interface.

## Colors

The canvas is near black graphite. Panels are only slightly lighter so that the hierarchy comes from spacing, borders and typography instead of heavy shadows.

`{colors.primary}` is the main action and active state color. It represents forward movement, approved interaction and the SmokeShield identity. It must not be used for danger or warnings.

`{colors.verified}` means a plan or data state has been checked successfully. `{colors.watch}` means conditions changed and human review may be appropriate. `{colors.escalated}` and `{colors.danger}` indicate material deterioration or urgent attention.

`{colors.info}` is reserved for neutral telemetry and informational data. `{colors.data-gap}` is used when evidence is stale, missing or unavailable.

Map colors have semantic meaning. Fire detections use warm red orange. The smoke corridor uses a restrained translucent green or neutral atmospheric tone. The school or facility marker remains bright and neutral so it is visually anchored against the environmental field.

Do not introduce a new accent color for individual pages. Keep the same semantic palette throughout the product.

## Typography

Use Space Grotesk for major display headings and Inter for interface text. Use JetBrains Mono for timestamps, source IDs, telemetry values, policy versions and technical identifiers.

Headings should be compact and information dense. Body text should remain highly readable at normal viewing distances. Labels should use small uppercase or sentence case treatments with increased letter spacing only where the label is acting as metadata.

Do not use oversized marketing typography inside the authenticated application. Reserve the largest display scale for the landing page hero and major page introductions.

Keep numeric telemetry visually distinct. Values such as `211 AQI`, `15 km/h`, `07:02 AM` and `82% confidence` should be easy to scan without creating a wall of giant numbers.

## Layout

Desktop uses a persistent left sidebar and a compact top command bar. The main workspace should feel like a single operating surface instead of a collection of unrelated cards.

The sidebar groups navigation into three areas: Operations, Intelligence and System. Command Center is the primary destination. PlanGuard status is persistent in the top bar because it is the user's most important current state.

Use a 12-column layout for desktop content when multiple panels are necessary. Prefer asymmetric compositions over repetitive three-column card grids. A dominant map plus a focused evidence or decision panel is preferred to a uniform dashboard matrix.

The main application content should generally use 24px internal page padding, 24px to 32px section gaps and clear vertical rhythm. Larger 48px to 80px spacing is reserved for major landing-page transitions or strong page openings.

The hero visual on the landing page may use full-bleed composition. Authenticated screens should keep the content contained inside the operations shell so that the interface remains usable and calm.

Mobile should collapse the desktop sidebar into bottom navigation with five primary destinations: Home, Map, Plan, Guard and More. Important actions stay within thumb reach. Tables should become stacked event cards or drawers where appropriate.

## Elevation & Depth

Use depth sparingly. Primary separation comes from surface tone, borders and whitespace rather than large shadows.

Panels sit one level above the canvas. Elevated panels are reserved for interactive decision surfaces, open evidence states and critical status summaries. Do not create a floating-card stack where every element appears to hover.

Use blur or glass effects only as a subtle atmospheric treatment for the landing page or map overlays. Never use blur as the default construction method for the application shell.

Map overlays may use translucency to communicate environmental density. UI controls placed over the map must remain readable and maintain strong contrast.

## Shapes

Use small to medium corner radii. The default control radius is 6px and the default panel radius is 10px. Avoid excessive rounded rectangles.

Pills are reserved for compact status badges, source labels and small categorical metadata. Large panels, buttons and primary navigation should not be pill shaped.

Do not use a different radius language on individual pages. The entire product should feel like one system.

## Components

### App shell

The left sidebar is quiet and functional. Use icon plus label navigation, small section headings and a persistent operational health indicator near the bottom. The top command bar contains school selector, current time, PlanGuard state, alerts and user controls.

### Plan Status

Plan Status is the most important component in the Command Center. It should visually dominate ordinary telemetry cards. A verified plan should show the approved activity, current scheduled time, last verification time and the action to inspect evidence.

### PlanGuard status

Use a compact status badge in the top bar and a large state panel on the PlanGuard page. The four major states are Verified, Watch, Escalation Required and Data Gap. Never communicate these states through color alone. Always include a textual label and supporting explanation.

### Buttons

Primary buttons use `{colors.primary}` with dark text. They represent explicit actions such as Apply Recommendation, Review Updated Plan or Approve.

Secondary buttons are outlined or neutral. Tertiary actions are text buttons. Do not use multiple competing primary buttons in the same visual region.

Danger actions must be explicit and rare. Do not use the danger color for generic attention.

### Cards and panels

Panels should contain a clear reason to exist. Every card must answer a question, expose evidence, represent a state or enable an action. Remove cards that only repeat information available elsewhere.

A panel title should state meaning, not component type. Prefer `Plan remains valid` over `Status Card` and `Why 10:00?` over `Analysis`.

### Inputs and forms

Inputs use dark panel surfaces, thin borders and visible labels. Focus states should use the primary accent with a visible outline. Forms should be short and task oriented.

### Timeline

Timelines are a core SmokeShield interaction. Use a thin rail, clearly labeled timestamps, a prominent playhead and restrained animation. The active segment uses the primary accent. Important events use small semantic markers.

### Evidence drawer

Evidence should open in a right side drawer on desktop and a full height sheet on mobile. Each evidence item displays source, timestamp, freshness and effect on the decision. Expandable details may expose raw values without overwhelming the primary view.

### Data health strip

Show source freshness as compact status indicators for fire observations, weather and air quality. A stale source changes the system confidence or recommendation state visually and textually.

### Maps

The map is a decision surface, not a decoration. Prioritize the school or facility, fire detections, wind direction, smoke influence corridor and current time. Use animated particles only where they communicate direction or movement.

Avoid generic heatmap styling. The corridor should read as a directional environmental field. The school marker must remain easy to locate even when the corridor is visually dense.

### What-if planner

The central interaction is a time slider. Moving the slider must change the visible risk relationship. Show the current plan and the proposed plan together so the user understands what changed.

### Forecast versus reality

PlanGuard uses a side by side comparison. Yesterday's approved evidence is on the left. Today's latest evidence is on the right. The center state explains whether the approved plan remains valid, should be reviewed or requires escalation.

### Audit log

Decision Log uses a dense chronological structure. Each event can open a detail drawer with actor, policy version, evidence snapshot and before and after state.

### Voice briefing

Voice Warden is presented as an executive briefing, not a music player. Show a short transcript, a compact waveform and the decision context. The most important actions are Approve, Review Evidence and Share.

### Share card

Parent facing communication must remove operational complexity. Show the schedule change, a plain language reason and a concise statement of evidence sources. Do not expose internal policy identifiers or raw telemetry in the default parent view.

## Do's and Don'ts

### Do

- Make the current operational state immediately visible.
- Use maps and timelines to explain environmental change over time.
- Show evidence freshness and uncertainty.
- Prefer one strong interaction over many small widgets.
- Use asymmetric layouts when they improve hierarchy.
- Use animation to explain movement, state change or causality.
- Preserve clear human approval boundaries for school wide decisions.
- Keep source attribution close to important environmental claims.
- Let failure states be honest and useful.
- Keep the same theme, color roles, spacing scale and radius system across every route.

### Don't

- Do not create a generic AQI dashboard made of metric cards.
- Do not use AI generated environmental scores without visible evidence.
- Do not claim exact exposure reduction percentages without validated measurements.
- Do not make color the only indicator of risk state.
- Do not use excessive glassmorphism, neon glow or decorative 3D objects.
- Do not turn every page into a dashboard grid.
- Do not automatically relax an approved precaution because conditions improved.
- Do not hide stale or conflicting data.
- Do not use arbitrary new accent colors for individual screens.
- Do not add animation that does not communicate meaning.
