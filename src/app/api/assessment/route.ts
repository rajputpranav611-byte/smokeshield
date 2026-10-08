import { NextResponse } from 'next/server';
import { EnvironmentalEvidenceOrchestrator } from '../../../domain/orchestrator';
import { FirmsProvider, OpenMeteoProvider } from '../../../domain/data/providers';
import { assessEnvironment } from '../../../domain/assessment';

export async function POST(req: Request) {
  try {
    const text = await req.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    const { school, operationalPlan, mode, referenceTime, scenarioId } = body;

    if (!school || typeof school.latitude !== 'number' || typeof school.longitude !== 'number') {
      return NextResponse.json({ error: "Invalid school or coordinates" }, { status: 400 });
    }
    if (!operationalPlan || !Array.isArray(operationalPlan.activities)) {
      return NextResponse.json({ error: "Invalid operational plan" }, { status: 400 });
    }
    if (mode !== 'LIVE' && mode !== 'REPLAY') {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    if (!referenceTime || isNaN(new Date(referenceTime).getTime())) {
      return NextResponse.json({ error: "Invalid referenceTime" }, { status: 400 });
    }
    if (mode === 'REPLAY' && !scenarioId) {
      return NextResponse.json({ error: "scenarioId is required for REPLAY mode" }, { status: 400 });
    }

    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      new FirmsProvider(),
      new OpenMeteoProvider()
    );

    const assessment = await assessEnvironment(
      orchestrator,
      school,
      operationalPlan,
      mode,
      referenceTime,
      scenarioId
    );

    return NextResponse.json(assessment, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message.includes("Replay scenario not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
