import { DeveloperRecord } from '../types';

const DISPOSABLE_DOMAINS = ['yopmail.com', 'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com'];

export interface FraudCheckResult {
  isSuspicious: boolean;
  suspicionReason: string;
  riskScore: number;
}

// Check completion time in hours
const getHours = (start: string, end: string | null): number | null => {
  if (!end) return null;
  return (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
};

// Perform fraud check on a single record
export const performFraudCheck = (record: Omit<DeveloperRecord, 'id'>): FraudCheckResult => {
  const flags: string[] = [];
  let score = 0;

  // Email checks
  if (record.email.includes('+')) { flags.push('Email alias'); score += 15; }
  const domain = record.email.split('@')[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.includes(domain)) { flags.push('Disposable email'); score += 40; }

  // Speed checks
  const hours = getHours(record.createdAt, record.completedAt);
  if (hours !== null) {
    if (hours < 0.5) { flags.push('Bot activity (<30min)'); score += 60; }
    else if (hours < 4) { flags.push('Speed run (<4h)'); score += 30; }
    else if (hours < 5) { flags.push('Rapid completion'); score += 15; }
  }

  // CA Status flag
  if (record.caStatus?.toLowerCase().includes('flag')) { flags.push('CA flagged'); score += 25; }

  return {
    isSuspicious: flags.length > 0,
    suspicionReason: flags.join('; '),
    riskScore: Math.min(score, 100),
  };
};

// Detect Sybil accounts (same wallet)
export const detectSybilAccounts = (records: Omit<DeveloperRecord, 'id'>[]): Map<string, number> => {
  const wallets = new Map<string, number>();
  records.forEach(r => {
    const w = r.walletAddress?.trim().toLowerCase();
    if (w) wallets.set(w, (wallets.get(w) || 0) + 1);
  });
  // Return only duplicates
  const result = new Map<string, number>();
  wallets.forEach((count, wallet) => { if (count > 1) result.set(wallet, count); });
  return result;
};

// Enrich records with fraud detection
export const enrichRecordsWithFraudDetection = (
  records: Omit<DeveloperRecord, 'id'>[]
): Omit<DeveloperRecord, 'id'>[] => {
  const sybils = detectSybilAccounts(records);
  
  return records.map(record => {
    const result = performFraudCheck(record);
    const wallet = record.walletAddress?.trim().toLowerCase();
    const sybilCount = wallet ? sybils.get(wallet) : undefined;
    
    if (sybilCount && sybilCount > 1) {
      result.isSuspicious = true;
      result.riskScore = Math.min(result.riskScore + 35, 100);
      result.suspicionReason = result.suspicionReason 
        ? `${result.suspicionReason}; Sybil (${sybilCount} accounts)` 
        : `Sybil (${sybilCount} accounts)`;
    }

    return { ...record, ...result };
  });
};

export const fraudDetectionService = { performFraudCheck, detectSybilAccounts, enrichRecordsWithFraudDetection };
export default fraudDetectionService;
