import Papa from 'papaparse';
import { DeveloperRecord } from '../types';

export interface CsvImportResult {
  validRecords: Omit<DeveloperRecord, 'id'>[];
  errors: string[];
}

const REQUIRED_HEADERS_CORE = [
  "Email", "First Name", "Last Name", "Phone Number", "Country",
  "Accepted Membership", "Accepted Marketing", "Wallet Address",
  "Percentage Completed", "Created At",
  "Completed At", "Final Score", "Final Grade", "CA Status"
];

// Helper to check for Partner Code logic
const hasPartnerCodeColumns = (headers: string[]) => {
    if (headers.includes("Partner Code")) return true;
    if (headers.includes("Code") && headers.includes("Partner")) return true;
    return false;
};

const mapCsvRowToRecord = (row: any): Omit<DeveloperRecord, 'id'> => {
  // Logic to resolve partner code
  let partnerCode = 'UNKNOWN';
  if (row['Partner Code']) {
      partnerCode = row['Partner Code'];
  } else if (row['Code']) {
      partnerCode = row['Code'];
  }

  return {
    email: row['Email'] || '',
    firstName: row['First Name'] || '',
    lastName: row['Last Name'] || '',
    phone: row['Phone Number'] || '',
    country: row['Country'] || '',
    acceptedMembership: String(row['Accepted Membership']).toLowerCase() === 'true' || row['Accepted Membership'] === '1',
    acceptedMarketing: String(row['Accepted Marketing']).toLowerCase() === 'true' || row['Accepted Marketing'] === '1',
    walletAddress: row['Wallet Address'] || '',
    partnerCode: partnerCode,
    percentageCompleted: Number(row['Percentage Completed']) || 0,
    createdAt: row['Created At'] || new Date().toISOString(),
    completedAt: row['Completed At'] || null,
    finalScore: Number(row['Final Score']) || 0,
    finalGrade: (row['Final Grade'] as any) || 'Pending',
    caStatus: row['CA Status'] || '',
  };
};

export const csvService = {
  parseCsv: (file: File): Promise<CsvImportResult> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];

          // Check Core Headers
          const missingHeaders = REQUIRED_HEADERS_CORE.filter(h => !headers.includes(h));

          // Check Partner/Code logic
          if (!hasPartnerCodeColumns(headers)) {
              missingHeaders.push("Partner Code (or 'Partner' and 'Code' columns)");
          }

          if (missingHeaders.length > 0) {
            resolve({
              validRecords: [],
              errors: [`Missing required columns: ${missingHeaders.join(', ')}`]
            });
            return;
          }

          const validRecords: Omit<DeveloperRecord, 'id'>[] = [];
          const errors: string[] = [];

          results.data.forEach((row: any, index) => {
             // Basic validation
             if (!row['Email']) {
                 errors.push(`Row ${index + 2}: Missing Email`);
                 return;
             }

             try {
                 const record = mapCsvRowToRecord(row);
                 validRecords.push(record);
             } catch (e) {
                 errors.push(`Row ${index + 2}: Error parsing data`);
             }
          });

          resolve({ validRecords, errors });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
};
