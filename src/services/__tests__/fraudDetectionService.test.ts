import { describe, it, expect } from 'vitest';
import { performFraudCheck, detectSybilAccounts, enrichRecordsWithFraudDetection } from '../fraudDetectionService';

const baseRecord = {
  email: 'user@gmail.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '',
  country: 'US',
  acceptedMembership: true,
  acceptedMarketing: false,
  walletAddress: '0.0.12345',
  partnerCode: 'TEST',
  percentageCompleted: 100,
  createdAt: '2024-01-01T10:00:00Z',
  completedAt: '2024-01-02T10:00:00Z',
  finalScore: 85,
  finalGrade: 'Pass' as const,
  caStatus: '',
};

describe('fraudDetectionService', () => {
  describe('performFraudCheck', () => {
    it('should flag disposable email', () => {
      const result = performFraudCheck({ ...baseRecord, email: 'test@yopmail.com' });
      expect(result.isSuspicious).toBe(true);
      expect(result.suspicionReason).toContain('Disposable email');
    });

    it('should flag email alias', () => {
      const result = performFraudCheck({ ...baseRecord, email: 'user+test@gmail.com' });
      expect(result.isSuspicious).toBe(true);
      expect(result.suspicionReason).toContain('Email alias');
    });

    it('should flag speed run (<4h)', () => {
      const result = performFraudCheck({ 
        ...baseRecord, 
        completedAt: '2024-01-01T12:00:00Z' // 2 hours
      });
      expect(result.isSuspicious).toBe(true);
      expect(result.suspicionReason).toContain('Speed run');
    });

    it('should flag bot activity (<30min)', () => {
      const result = performFraudCheck({ 
        ...baseRecord, 
        completedAt: '2024-01-01T10:15:00Z' // 15 minutes
      });
      expect(result.isSuspicious).toBe(true);
      expect(result.suspicionReason).toContain('Bot activity');
    });

    it('should not flag clean records', () => {
      const result = performFraudCheck(baseRecord);
      expect(result.isSuspicious).toBe(false);
      expect(result.riskScore).toBe(0);
    });
  });

  describe('detectSybilAccounts', () => {
    it('should detect duplicate wallets', () => {
      const records = [
        { ...baseRecord, email: 'user1@test.com', walletAddress: '0.0.12345' },
        { ...baseRecord, email: 'user2@test.com', walletAddress: '0.0.12345' },
        { ...baseRecord, email: 'user3@test.com', walletAddress: '0.0.99999' },
      ];
      const sybils = detectSybilAccounts(records);
      expect(sybils.size).toBe(1);
      expect(sybils.get('0.0.12345')).toBe(2);
    });

    it('should return empty for unique wallets', () => {
      const records = [
        { ...baseRecord, walletAddress: '0.0.11111' },
        { ...baseRecord, walletAddress: '0.0.22222' },
      ];
      expect(detectSybilAccounts(records).size).toBe(0);
    });
  });

  describe('enrichRecordsWithFraudDetection', () => {
    it('should enrich with fraud flags', () => {
      const records = [
        { ...baseRecord, email: 'test@yopmail.com', walletAddress: '0.0.11111' },
        { ...baseRecord, email: 'clean@gmail.com', walletAddress: '0.0.22222' },
      ];
      const enriched = enrichRecordsWithFraudDetection(records);
      expect(enriched[0].isSuspicious).toBe(true);
      expect(enriched[1].isSuspicious).toBe(false);
    });

    it('should add Sybil flags', () => {
      const records = [
        { ...baseRecord, email: 'user1@test.com', walletAddress: '0.0.12345' },
        { ...baseRecord, email: 'user2@test.com', walletAddress: '0.0.12345' },
      ];
      const enriched = enrichRecordsWithFraudDetection(records);
      expect(enriched[0].isSuspicious).toBe(true);
      expect(enriched[0].suspicionReason).toContain('Sybil');
    });
  });
});
