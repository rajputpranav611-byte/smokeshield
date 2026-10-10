/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from './plan';
import { PlanRepository } from '../data/PlanRepository';
import { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

vi.mock('../data/PlanRepository');

describe('Plan Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createEvent = (method: string, path: string, groups: string[], body?: any, query?: any): APIGatewayProxyEventV2WithJWTAuthorizer => {
    return {
      requestContext: {
        http: { method, path },
        authorizer: {
          jwt: {
            claims: {
              'cognito:groups': groups,
              sub: 'user123'
            }
          }
        }
      },
      queryStringParameters: query,
      body: body ? JSON.stringify(body) : undefined,
    } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
  };

  const createUnauthEvent = (method: string, path: string): APIGatewayProxyEventV2WithJWTAuthorizer => {
    return {
      requestContext: {
        http: { method, path }
      }
    } as APIGatewayProxyEventV2WithJWTAuthorizer;
  };

  it('rejects unauthenticated requests', async () => {
    const event = createUnauthEvent('POST', '/plans');
    const response = await handler(event) as APIGatewayProxyStructuredResultV2;
    expect(response.statusCode).toBe(401);
  });

  it('rejects requests with no valid groups', async () => {
    const event = createEvent('POST', '/plans', ['RandomGroup']);
    const response = await handler(event) as APIGatewayProxyStructuredResultV2;
    expect(response.statusCode).toBe(401);
  });

  it('allows SchoolOperator to create plans', async () => {
    const event = createEvent('POST', '/plans', ['SchoolOperator'], {
      id: 'plan-1',
      schoolId: 'school-1',
      version: 1,
      activities: [],
      status: 'DRAFT',
      policyVersion: '1.0'
    });
    const response = await handler(event) as APIGatewayProxyStructuredResultV2;
    expect(response.statusCode).toBe(201);
    expect(PlanRepository.prototype.savePlan).toHaveBeenCalled();
  });

  it('prevents SchoolOperator from approving plans', async () => {
    const event = createEvent('POST', '/plans/plan-1/approve', ['SchoolOperator'], {
      planVersion: 1,
      evidenceSnapshotId: 'snap-1',
      policyVersion: '1.0'
    });
    const response = await handler(event) as APIGatewayProxyStructuredResultV2;
    expect(response.statusCode).toBe(403);
    expect(PlanRepository.prototype.saveApproval).not.toHaveBeenCalled();
  });

  it('allows Principal to approve plans', async () => {
    const event = createEvent('POST', '/plans/plan-1/approve', ['Principal'], {
      planVersion: 1,
      evidenceSnapshotId: 'snap-1',
      policyVersion: '1.0'
    });
    const response = await handler(event) as APIGatewayProxyStructuredResultV2;
    expect(response.statusCode).toBe(200);
    expect(PlanRepository.prototype.saveApproval).toHaveBeenCalled();
  });

  it('allows Admin to approve plans', async () => {
    const event = createEvent('POST', '/plans/plan-1/approve', ['Admin'], {
      planVersion: 1,
      evidenceSnapshotId: 'snap-1',
      policyVersion: '1.0'
    });
    const response = await handler(event) as APIGatewayProxyStructuredResultV2;
    expect(response.statusCode).toBe(200);
    expect(PlanRepository.prototype.saveApproval).toHaveBeenCalled();
  });

  it('retrieves a plan correctly', async () => {
    vi.mocked(PlanRepository.prototype.getPlan).mockResolvedValue({ id: 'plan-1' } as any);
    const event = createEvent('GET', '/plans/plan-1', ['SchoolOperator'], undefined, { schoolId: 'school-1' });
    const response = await handler(event) as APIGatewayProxyStructuredResultV2;
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body as string).id).toBe('plan-1');
  });
});
