# Firebase Cloud Functions

This directory is a placeholder for Firebase Cloud Functions.

## Setup Instructions

1. Initialize functions:
   ```bash
   cd functions
   npm init -y
   npm install firebase-functions firebase-admin
   ```

2. Create `src/index.ts` with your cloud functions:
   - `generateAiInsight` - Calls Gemini API securely
   - `sendCampaign` - Sends email campaigns via SendGrid

3. Set secrets:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   ```

4. Deploy:
   ```bash
   firebase deploy --only functions
   ```

## Required Functions

### generateAiInsight
- Accepts: `{ metrics, context }`
- Returns: `{ summary: string }`
- Securely calls Google Gemini API

### sendCampaign  
- Accepts: `{ templateId, filterCriteria }`
- Returns: `{ success, recipientCount }`
- Requires Super Admin role
