// Types for the metrics
export interface DashboardMetrics {
  totalRegistered: number;
  totalCertified: number;
  usersStartedCourse: number;
  usersStartedCoursePct: number;
  avgCompletionTimeDays: number;
  activeCommunities: number;
  certificationRate: number;
  overallSubscriberRate: number;
  potentialFakeAccounts: number;
  potentialFakeAccountsPct: number;
  rapidCompletions: number;
}

export interface DeveloperRecord {
  id: string;
  partnerCode: string;
  registrationDate: string; // ISO string
  completionDate?: string; // ISO string
  status: 'Registered' | 'In Progress' | 'Certified' | 'Flagged';
  score?: number;
}

export const calculateDashboardMetrics = (data: DeveloperRecord[], start: Date | null, end: Date | null): DashboardMetrics => {
    // Filter by date if provided
    const filteredData = data.filter(d => {
        const dDate = new Date(d.registrationDate);
        if (start && dDate < start) return false;
        if (end && dDate > end) return false;
        return true;
    });

    const totalRegistered = filteredData.length;
    const certifiedUsers = filteredData.filter(d => d.status === 'Certified');
    const totalCertified = certifiedUsers.length;

    const usersStarted = filteredData.filter(d => d.status === 'In Progress' || d.status === 'Certified');
    const usersStartedCourse = usersStarted.length;

    // Average Completion Time
    let totalTime = 0;
    let completedCount = 0;
    certifiedUsers.forEach(u => {
        if (u.completionDate && u.registrationDate) {
            const diff = new Date(u.completionDate).getTime() - new Date(u.registrationDate).getTime();
            totalTime += diff;
            completedCount++;
        }
    });
    const avgCompletionTimeDays = completedCount > 0 ? (totalTime / (1000 * 60 * 60 * 24)) / completedCount : 0;

    // Fake Accounts (Mock logic: < 1 day completion or specific flag)
    const flagged = filteredData.filter(d => d.status === 'Flagged');
    const rapid = certifiedUsers.filter(u => {
         if (!u.completionDate) return false;
         const hours = (new Date(u.completionDate).getTime() - new Date(u.registrationDate).getTime()) / (1000 * 60 * 60);
         return hours < 5;
    });

    const uniqueCommunities = new Set(filteredData.map(d => d.partnerCode));

    return {
        totalRegistered,
        totalCertified,
        usersStartedCourse,
        usersStartedCoursePct: totalRegistered > 0 ? (usersStartedCourse / totalRegistered) * 100 : 0,
        avgCompletionTimeDays,
        activeCommunities: uniqueCommunities.size,
        certificationRate: totalRegistered > 0 ? (totalCertified / totalRegistered) * 100 : 0,
        overallSubscriberRate: 45.2, // Mocked as we don't have email status in this simple type
        potentialFakeAccounts: flagged.length + rapid.length,
        potentialFakeAccountsPct: totalRegistered > 0 ? ((flagged.length + rapid.length) / totalRegistered) * 100 : 0,
        rapidCompletions: rapid.length
    };
};

export const generateChartData = (data: DeveloperRecord[], start: Date | null, end: Date | null) => {
    // Bucket by month or day depending on range. For simplicity, let's bucket by month for "All Time" and Day for shorter ranges.
    // Defaulting to simple monthly bucketing for this implementation.

    const buckets: Record<string, { registrations: number, certifications: number }> = {};

    const filteredData = data.filter(d => {
        const dDate = new Date(d.registrationDate);
        if (start && dDate < start) return false;
        if (end && dDate > end) return false;
        return true;
    });

    filteredData.forEach(d => {
        const date = new Date(d.registrationDate);
        const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`; // e.g., "Oct 2023"

        if (!buckets[key]) buckets[key] = { registrations: 0, certifications: 0 };
        buckets[key].registrations++;

        if (d.status === 'Certified' && d.completionDate) {
             const cDate = new Date(d.completionDate);
             const cKey = `${cDate.toLocaleString('default', { month: 'short' })} ${cDate.getFullYear()}`;
             if (!buckets[cKey]) buckets[cKey] = { registrations: 0, certifications: 0 };
             buckets[cKey].certifications++;
        }
    });

    return Object.entries(buckets).map(([name, val]) => ({ name, ...val })).sort((a,b) => {
        // Sort by date (naive string sort won't work perfectly, but sufficient for mock if key includes year)
        return new Date(a.name).getTime() - new Date(b.name).getTime();
    });
};

export const generateLeaderboard = (data: DeveloperRecord[]) => {
    const counts: Record<string, number> = {};
    data.filter(d => d.status === 'Certified').forEach(d => {
        counts[d.partnerCode] = (counts[d.partnerCode] || 0) + 1;
    });

    return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10
};
