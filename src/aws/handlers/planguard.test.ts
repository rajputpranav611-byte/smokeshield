import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from './planguard';
import { PlanRepository } from '../data/PlanRepository';
import * as assessmentModule from '../../domain/assessment';

vi.mock('../data/PlanRepository');
vi.mock('../../domain/assessment');

describe('PlanGuard Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if missing event fields', async () => {
    await expect(handler({})).rejects.toThrow('Missing schoolId, planId, or version in event');
  });

  it('throws if plan is not found', async () => {
    vi.mocked(PlanRepository.prototype.getPlan).mockResolvedValue(null);
    await expect(handler({ schoolId: 's', planId: 'p', version: 1 })).rejects.toThrow('Plan not found');
  });

  it('handles VERIFIED properly', async () => {
    vi.mocked(PlanRepository.prototype.getPlan).mockResolvedValue({ id: 'p', policyVersion: '1' } as any);
    vi.mocked(PlanRepository.prototype.getApproval).mockResolvedValue({ evidenceSnapshotId: 'snap-1' } as any);
    
    vi.mocked(assessmentModule.assessEnvironment)
      .mockResolvedValueOnce({
        dataQuality: { hasMissingCriticalData: false, notes: [] },
        riskAssessment: { confidenceScore: 0.9, overlapMinutes: 0, evidenceIds: [] }
      } as any)
      .mockResolvedValueOnce({
        dataQuality: { hasMissingCriticalData: false, notes: [] },
        riskAssessment: { confidenceScore: 0.9, overlapMinutes: 0, evidenceIds: [] }
      } as any);

    const result = await handler({ schoolId: 's', planId: 'p', version: 1 }) as any;
    expect(result.success).toBe(true);
    expect(result.verification.status).toBe('VERIFIED');
    expect(PlanRepository.prototype.saveVerification).toHaveBeenCalled();
  });

  it('handles DATA_GAP properly', async () => {
    vi.mocked(PlanRepository.prototype.getPlan).mockResolvedValue({ id: 'p', policyVersion: '1' } as any);
    vi.mocked(PlanRepository.prototype.getApproval).mockResolvedValue({ evidenceSnapshotId: 'snap-1' } as any);
    
    vi.mocked(assessmentModule.assessEnvironment)
      .mockResolvedValueOnce({
        dataQuality: { hasMissingCriticalData: false, notes: [] },
        riskAssessment: { confidenceScore: 0.4, overlapMinutes: 0, evidenceIds: [] }
      } as any)
      .mockResolvedValueOnce({
        dataQuality: { hasMissingCriticalData: false, notes: [] },
        riskAssessment: { confidenceScore: 0.9, overlapMinutes: 0, evidenceIds: [] }
      } as any);

    const result = await handler({ schoolId: 's', planId: 'p', version: 1 }) as any;
    expect(result.verification.status).toBe('DATA_GAP');
  });

  it('handles ESCALATED properly', async () => {
    vi.mocked(PlanRepository.prototype.getPlan).mockResolvedValue({ id: 'p', policyVersion: '1' } as any);
    vi.mocked(PlanRepository.prototype.getApproval).mockResolvedValue({ evidenceSnapshotId: 'snap-1' } as any);
    
    vi.mocked(assessmentModule.assessEnvironment)
      .mockResolvedValueOnce({
        dataQuality: { hasMissingCriticalData: false, notes: [] },
        riskAssessment: { confidenceScore: 0.9, overlapMinutes: 40, evidenceIds: [] }
      } as any)
      .mockResolvedValueOnce({
        dataQuality: { hasMissingCriticalData: false, notes: [] },
        riskAssessment: { confidenceScore: 0.9, overlapMinutes: 10, evidenceIds: [] }
      } as any);

    const result = await handler({ schoolId: 's', planId: 'p', version: 1 }) as any;
    expect(result.verification.status).toBe('ESCALATED');
  });

  it('handles WATCH properly', async () => {
    vi.mocked(PlanRepository.prototype.getPlan).mockResolvedValue({ id: 'p', policyVersion: '1' } as any);
    vi.mocked(PlanRepository.prototype.getApproval).mockResolvedValue({ evidenceSnapshotId: 'snap-1' } as any);
    
    vi.mocked(assessmentModule.assessEnvironment)
      .mockResolvedValueOnce({
        dataQuality: { hasMissingCriticalData: false, notes: [] },
        riskAssessment: { confidenceScore: 0.9, overlapMinutes: 15, evidenceIds: [] }
      } as any)
      .mockResolvedValueOnce({
        dataQuality: { hasMissingCriticalData: false, notes: [] },
        riskAssessment: { confidenceScore: 0.9, overlapMinutes: 5, evidenceIds: [] }
      } as any);

    const result = await handler({ schoolId: 's', planId: 'p', version: 1 }) as any;
    expect(result.verification.status).toBe('WATCH');
  });
});
