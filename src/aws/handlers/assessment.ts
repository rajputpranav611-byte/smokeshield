import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { EnvironmentalEvidenceOrchestrator } from '../../domain/orchestrator';
import { FirmsProvider, OpenMeteoProvider } from '../../domain/data/providers';
import { assessEnvironment } from '../../domain/assessment';
import { getFirmsMapKey } from '../config/secrets';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    if (event.requestContext.http.method !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Malformed JSON" }) };
    }

    const { school, operationalPlan, mode, referenceTime, scenarioId } = body;

    if (!school || typeof school.latitude !== 'number' || typeof school.longitude !== 'number') {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid school or coordinates" }) };
    }
    if (!operationalPlan || !Array.isArray(operationalPlan.activities)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid operational plan" }) };
    }
    if (mode !== 'LIVE' && mode !== 'REPLAY') {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid mode" }) };
    }
    if (!referenceTime || isNaN(new Date(referenceTime).getTime())) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid referenceTime" }) };
    }
    if (mode === 'REPLAY' && !scenarioId) {
      return { statusCode: 400, body: JSON.stringify({ error: "scenarioId is required for REPLAY mode" }) };
    }

    const orchestrator = new EnvironmentalEvidenceOrchestrator(
      new FirmsProvider(getFirmsMapKey),
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assessment)
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message.includes("Replay scenario not found")) {
      return { statusCode: 404, body: JSON.stringify({ error: message }) };
    }

    console.error("Assessment Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
