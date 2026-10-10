import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PlanRepository } from '../data/PlanRepository';
import { OperationalPlan, PlanApproval } from '../../types/domain';

const repo = new PlanRepository();

function authorize(event: APIGatewayProxyEventV2): { authorized: boolean; actorId?: string; role?: string } {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) return { authorized: false };
  
  // In a real implementation, this would verify a Cognito JWT.
  // We mock the role extraction based on the token for this implementation boundary.
  if (authHeader.includes('Principal')) return { authorized: true, actorId: 'principal-1', role: 'Principal' };
  if (authHeader.includes('Admin')) return { authorized: true, actorId: 'admin-1', role: 'Admin' };
  if (authHeader.includes('SchoolOperator')) return { authorized: true, actorId: 'operator-1', role: 'SchoolOperator' };

  return { authorized: false };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;

    // Authorization check
    const auth = authorize(event);
    if (!auth.authorized) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    if (method === 'GET' && path.match(/^\/plans\/([^\/]+)$/)) {
      const match = path.match(/^\/plans\/([^\/]+)$/);
      const planId = match?.[1];
      if (!planId) return { statusCode: 400, body: JSON.stringify({ error: "Invalid plan ID" }) };
      
      const version = event.queryStringParameters?.version ? parseInt(event.queryStringParameters.version, 10) : 1;
      const schoolId = event.queryStringParameters?.schoolId;
      if (!schoolId) return { statusCode: 400, body: JSON.stringify({ error: "schoolId required" }) };

      const plan = await repo.getPlan(schoolId, planId, version);
      if (!plan) return { statusCode: 404, body: JSON.stringify({ error: "Plan not found" }) };

      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) };
    }

    if (method === 'POST' && path === '/plans') {
      if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
      const body = JSON.parse(event.body);
      const plan = body as OperationalPlan;
      if (!plan.id || !plan.schoolId || !plan.version) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid plan data" }) };
      }

      await repo.savePlan(plan);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, id: plan.id }) };
    }

    if (method === 'POST' && path.match(/^\/plans\/([^\/]+)\/approve$/)) {
      if (auth.role !== 'Principal' && auth.role !== 'Admin') {
        return { statusCode: 403, body: JSON.stringify({ error: "Insufficient role for approval" }) };
      }

      const match = path.match(/^\/plans\/([^\/]+)\/approve$/);
      const planId = match?.[1];
      if (!planId) return { statusCode: 400, body: JSON.stringify({ error: "Invalid plan ID" }) };

      if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
      const body = JSON.parse(event.body);
      
      const approval: PlanApproval = {
        planId,
        planVersion: body.planVersion,
        actorId: auth.actorId!,
        actorRole: auth.role!,
        approvedAt: new Date().toISOString(),
        evidenceSnapshotId: body.evidenceSnapshotId,
        policyVersion: body.policyVersion
      };

      if (!approval.planVersion || !approval.evidenceSnapshotId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing required approval fields" }) };
      }

      await repo.saveApproval(approval);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, approvedAt: approval.approvedAt }) };
    }

    return { statusCode: 404, body: JSON.stringify({ error: "Not Found" }) };

  } catch (error: unknown) {
    console.error("Plan API Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
