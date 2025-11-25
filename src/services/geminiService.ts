import { DashboardMetrics } from './dataProcessing';

// Cloud Function URL for AI insights (to be configured in production)
const CLOUD_FUNCTION_URL = import.meta.env.REACT_APP_AI_FUNCTION_URL || null;

/**
 * Generates an executive summary using AI.
 * In production, this calls a Firebase Cloud Function that securely handles the Gemini API key.
 * In development/demo, it returns a simulated response.
 */
export const generateExecutiveSummary = async (metrics: DashboardMetrics, context: string): Promise<string> => {
    // If Cloud Function URL is configured, use it
    if (CLOUD_FUNCTION_URL) {
        try {
            const response = await fetch(CLOUD_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ metrics, context }),
            });
            
            if (!response.ok) {
                throw new Error('AI service unavailable');
            }
            
            const data = await response.json();
            return data.summary;
        } catch (error) {
            console.error('Error calling AI Cloud Function:', error);
            // Fall back to simulated response
        }
    }

    // Development/Demo mode: Simulate API delay and return mock response
    await new Promise(resolve => setTimeout(resolve, 1500));

    const certRate = metrics.certificationRate.toFixed(1);
    const fakeRate = metrics.potentialFakeAccountsPct.toFixed(1);
    
    // Generate a more dynamic simulated response based on actual metrics
    let insights: string[] = [];
    
    if (metrics.certificationRate > 50) {
        insights.push(`Strong performance with ${certRate}% certification success rate.`);
    } else if (metrics.certificationRate > 25) {
        insights.push(`Moderate certification rate of ${certRate}%. Consider engagement initiatives.`);
    } else {
        insights.push(`Certification rate of ${certRate}% indicates room for improvement.`);
    }

    if (metrics.potentialFakeAccounts > 0) {
        insights.push(`${metrics.potentialFakeAccounts} accounts (${fakeRate}%) flagged for suspicious activity - review recommended.`);
    }

    if (metrics.rapidCompletions > 0) {
        insights.push(`${metrics.rapidCompletions} rapid completions detected (<5h).`);
    }

    insights.push(`Total of ${metrics.totalCertified} certified developers across ${metrics.activeCommunities} active communities.`);

    return `Analysis of ${context}: ${insights.join(' ')} Average completion time: ${metrics.avgCompletionTimeDays.toFixed(1)} days.`;
};

export default { generateExecutiveSummary };
