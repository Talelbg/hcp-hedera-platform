import { DeveloperRecord, ChartDataPoint, MembershipMetrics, MembershipChartPoint } from '../types';

// Helper to check if a date falls within a specific date range
const isDateInRange = (dateStr: string | null, startDate: Date | null, endDate: Date | null): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    
    return true;
};

// Helper to calculate the "Previous Period" based on current selection
export const getPreviousPeriod = (start: Date, end: Date): { start: Date, end: Date } => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const prevEnd = new Date(start);
    prevEnd.setDate(start.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - diffDays);
    prevStart.setHours(0, 0, 0, 0);

    return { start: prevStart, end: prevEnd };
};

// 2.2 Deterministic Data Cleaning (The "AM/PM" Fix)
const applyAmPmFix = (record: DeveloperRecord): DeveloperRecord => {
  if (!record.completedAt || !record.createdAt) return record;

  const created = new Date(record.createdAt);
  let completed = new Date(record.completedAt);

  if (isNaN(created.getTime()) || isNaN(completed.getTime())) return record;

  if (completed.getTime() < created.getTime()) {
    completed = new Date(completed.getTime() + 12 * 60 * 60 * 1000);
  }

  return {
    ...record,
    completedAt: completed.toISOString(),
  };
};

export const processIngestedData = (rawData: DeveloperRecord[]): DeveloperRecord[] => {
  // PASS 1: Build Wallet Frequency Map for Sybil Detection
  const walletCounts = new Map<string, number>();
  rawData.forEach(r => {
      if(r.walletAddress && r.walletAddress.length > 10) { // Basic length check to ignore 'N/A'
          const w = r.walletAddress.trim().toLowerCase();
          if (w !== 'n/a' && w !== 'none') {
             walletCounts.set(w, (walletCounts.get(w) || 0) + 1);
          }
      }
  });

  // KNOWN DISPOSABLE DOMAINS
  const disposableDomains = [
      'yopmail.com', 'mailinator.com', 'temp-mail.org', 'guerrillamail.com', 
      '10minutemail.com', 'sharklasers.com', 'throwawaymail.com', 'getnada.com'
  ];

  return rawData.map((record) => {
    // 1. Apply AM/PM Fix
    const r = applyAmPmFix(record);
    
    const flags: string[] = [];
    let isSuspicious = false;
    let dataError = false;
    let durationHours = 0;

    // 2. Speed Run & Data Error Check
    if (r.completedAt && r.createdAt) {
        const start = new Date(r.createdAt).getTime();
        const end = new Date(r.completedAt).getTime();
        
        if (!isNaN(start) && !isNaN(end)) {
            durationHours = (end - start) / (1000 * 60 * 60);
            
            if (durationHours < 0) {
                 dataError = true; // Still negative after fix? Data Error.
            } else if (durationHours < 4 && r.finalGrade === 'Pass') {
                 isSuspicious = true;
                 if (durationHours < 0.5) {
                     flags.push('Bot Activity (<30m)');
                 } else {
                     flags.push('Speed Run (<4h)');
                 }
            }
        }
    }

    // 3. Email Forensics
    if (r.email) {
        const emailLower = r.email.toLowerCase();
        
        // Alias Check (e.g. user+test@gmail.com)
        if (emailLower.includes('+')) {
            isSuspicious = true;
            flags.push('Email Alias');
        }

        // Disposable Domain Check
        const domain = emailLower.split('@')[1];
        if (domain && disposableDomains.includes(domain)) {
            isSuspicious = true;
            flags.push('Disposable Email');
        }
    }

    // 4. Sybil Check (Duplicate Wallets)
    if (r.walletAddress && r.walletAddress.length > 10) {
        const w = r.walletAddress.trim().toLowerCase();
        const count = walletCounts.get(w) || 0;
        if (count > 1) {
            isSuspicious = true;
            flags.push(`Sybil (Shared Wallet)`);
        }
    }

    return {
        ...r,
        durationHours,
        isSuspicious,
        suspicionReason: flags.join(', '),
        dataError,
    };
  });
};

export const calculateDashboardMetrics = (data: DeveloperRecord[], startDate: Date | null, endDate: Date | null) => {
  const registeredInPeriod = data.filter(r => isDateInRange(r.createdAt, startDate, endDate));
  const totalRegistered = registeredInPeriod.length;

  const certifiedInPeriod = data.filter(r => r.percentageCompleted === 100 && isDateInRange(r.completedAt, startDate, endDate));
  const totalCertified = certifiedInPeriod.length;
  
  const usersStarted = registeredInPeriod.filter(r => r.percentageCompleted > 0).length;
  const subscribers = registeredInPeriod.filter(r => r.acceptedMarketing).length;

  const uniqueCommunities = new Set(data.filter(r => isDateInRange(r.createdAt, startDate, endDate) || isDateInRange(r.completedAt, startDate, endDate))
                                        .map((r) => r.partnerCode)
                                        .filter(p => p && p !== 'UNKNOWN'));
  const activeCommunities = uniqueCommunities.size;

  const certifiedUsers = certifiedInPeriod.filter(r => 
    r.completedAt && 
    !r.dataError && 
    r.durationHours !== undefined &&
    r.durationHours > 0
  );
  
  let totalDurationMs = 0;
  let validCount = 0;

  certifiedUsers.forEach(curr => {
      const start = new Date(curr.createdAt).getTime();
      const end = new Date(curr.completedAt!).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        totalDurationMs += (end - start);
        validCount++;
      }
  });
  
  const avgCompletionTimeDays = validCount > 0 
    ? (totalDurationMs / validCount) / (1000 * 60 * 60 * 24) 
    : 0;

  // STRICTER FRAUD CALCULATION
  // Only count isSuspicious. Do NOT count dataErrors as "Fake Accounts".
  const potentialFake = registeredInPeriod.filter(r => r.isSuspicious).length;

  const rapidCompletions = certifiedUsers.filter(r => 
    r.finalGrade === 'Pass' && 
    r.durationHours !== undefined && 
    r.durationHours >= 0 && 
    r.durationHours < 5
  ).length;

  return {
    totalRegistered,
    totalCertified,
    usersStartedCourse: usersStarted,
    usersStartedCoursePct: totalRegistered > 0 ? (usersStarted / totalRegistered) * 100 : 0,
    activeCommunities,
    avgCompletionTimeDays,
    certificationRate: totalRegistered > 0 ? (totalCertified / totalRegistered) * 100 : 0,
    overallSubscriberRate: totalRegistered > 0 ? (subscribers / totalRegistered) * 100 : 0,
    potentialFakeAccounts: potentialFake,
    potentialFakeAccountsPct: totalRegistered > 0 ? (potentialFake / totalRegistered) * 100 : 0,
    rapidCompletions
  };
};

export const generateChartData = (data: DeveloperRecord[], startDate: Date | null, endDate: Date | null): ChartDataPoint[] => {
    if (data.length === 0) return [];

    let granularity: 'Daily' | 'Weekly' = 'Weekly';
    
    if (startDate && endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays <= 60) {
            granularity = 'Daily';
        }
    }

    const timeline: Record<string, { registrations: number; certifications: number; sortDate: number }> = {};

    const getGroupKey = (d: Date): { label: string, sortDate: number } => {
        const date = new Date(d);
        date.setHours(0,0,0,0);

        if (granularity === 'Daily') {
            return {
                label: date.toISOString(),
                sortDate: date.getTime()
            };
        } else {
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            return {
                label: monday.toISOString(),
                sortDate: monday.getTime()
            };
        }
    };

    // PRE-FILL Zero Values for smoother charts if custom range
    if (startDate && endDate) {
        let curr = new Date(startDate);
        while (curr <= endDate) {
            const { label, sortDate } = getGroupKey(curr);
            if (!timeline[label]) timeline[label] = { registrations: 0, certifications: 0, sortDate };
            curr.setDate(curr.getDate() + 1);
        }
    }

    data.forEach(record => {
        if (isDateInRange(record.createdAt, startDate, endDate)) {
            const regDate = new Date(record.createdAt);
            if (!isNaN(regDate.getTime())) {
                const { label, sortDate } = getGroupKey(regDate);
                if (!timeline[label]) timeline[label] = { registrations: 0, certifications: 0, sortDate };
                timeline[label].registrations++;
            }
        }

        if (record.completedAt && record.percentageCompleted === 100 && isDateInRange(record.completedAt, startDate, endDate)) {
            const certDate = new Date(record.completedAt);
            if (!isNaN(certDate.getTime())) {
                const { label, sortDate } = getGroupKey(certDate);
                if (!timeline[label]) timeline[label] = { registrations: 0, certifications: 0, sortDate };
                timeline[label].certifications++;
            }
        }
    });

    const sortedData = Object.values(timeline)
        .sort((a, b) => a.sortDate - b.sortDate)
        .map(item => ({
            name: new Date(item.sortDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
            }),
            registrations: item.registrations,
            certifications: item.certifications
        }));

    if (!startDate && !endDate) {
        return sortedData.slice(-24);
    }

    return sortedData;
};

export const generateLeaderboard = (data: DeveloperRecord[]) => {
    const counts: Record<string, number> = {};
    data.forEach(r => {
        if (!r.partnerCode || r.partnerCode === 'UNKNOWN') return;
        if (r.percentageCompleted === 100) {
            counts[r.partnerCode] = (counts[r.partnerCode] || 0) + 1;
        }
    });

    return Object.keys(counts)
        .map(key => ({ name: key, value: counts[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
};

export const calculateMembershipMetrics = (data: DeveloperRecord[], startDate: Date | null, endDate: Date | null): MembershipMetrics => {
    const enrolledInPeriod = data.filter(r => isDateInRange(r.createdAt, startDate, endDate));
    const totalEnrolled = enrolledInPeriod.length;
    const members = enrolledInPeriod.filter(r => r.acceptedMembership);
    const totalMembers = members.length;
    const certifiedMembers = members.filter(r => r.finalGrade === 'Pass').length;
    const activeCommunities = new Set(members.map(r => r.partnerCode).filter(p => p && p !== 'UNKNOWN')).size;

    return {
        totalEnrolled,
        totalMembers,
        membershipRate: totalEnrolled > 0 ? (totalMembers / totalEnrolled) * 100 : 0,
        certifiedMembers,
        certifiedMemberRate: totalMembers > 0 ? (certifiedMembers / totalMembers) * 100 : 0,
        activeCommunities
    };
};

export const generateMembershipChartData = (data: DeveloperRecord[], startDate: Date | null, endDate: Date | null): MembershipChartPoint[] => {
    if (data.length === 0) return [];
    let granularity: 'Daily' | 'Weekly' = 'Weekly';
    if (startDate && endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays <= 60) granularity = 'Daily';
    }
    const timeline: Record<string, { enrollees: number; newMembers: number; sortDate: number }> = {};
    const getGroupKey = (d: Date) => {
        const date = new Date(d);
        date.setHours(0,0,0,0);
        if (granularity === 'Daily') {
            return { label: date.toISOString(), sortDate: date.getTime() };
        } else {
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            return { label: monday.toISOString(), sortDate: monday.getTime() };
        }
    };
    data.forEach(record => {
        if (isDateInRange(record.createdAt, startDate, endDate)) {
            const regDate = new Date(record.createdAt);
            if (!isNaN(regDate.getTime())) {
                const { label, sortDate } = getGroupKey(regDate);
                if (!timeline[label]) timeline[label] = { enrollees: 0, newMembers: 0, sortDate };
                timeline[label].enrollees++;
                if (record.acceptedMembership) {
                    timeline[label].newMembers++;
                }
            }
        }
    });
    const sorted = Object.values(timeline)
        .sort((a, b) => a.sortDate - b.sortDate)
        .map(item => ({
            name: new Date(item.sortDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            enrollees: item.enrollees,
            newMembers: item.newMembers
        }));
     if (!startDate && !endDate) return sorted.slice(-24);
     return sorted;
};