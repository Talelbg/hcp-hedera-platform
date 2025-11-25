import Papa from 'papaparse';
import { DeveloperRecord } from '../types';

export interface CsvImportResult {
  validRecords: Omit<DeveloperRecord, 'id'>[];
  errors: string[];
}

// Normalize header for matching: lowercase, trim, collapse spaces
export const normalizeHeader = (header: string): string => {
  return header.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Required headers with their normalized forms for matching
const REQUIRED_HEADERS_CORE = [
  "Email", "First Name", "Last Name", "Phone Number", "Country",
  "Accepted Membership", "Accepted Marketing", "Wallet Address",
  "Percentage Completed", "Created At",
  "Completed At", "Final Score", "Final Grade", "CA Status"
];

// Pre-compute a mapping from normalized header names to actual header names
type HeaderMap = Map<string, string>;

const buildHeaderMap = (headers: string[]): HeaderMap => {
  const map = new Map<string, string>();
  for (const header of headers) {
    map.set(normalizeHeader(header), header);
  }
  return map;
};

// Find a header in CSV headers using case-insensitive matching
export const findHeader = (headers: string[], targetHeader: string): string | undefined => {
  const normalizedTarget = normalizeHeader(targetHeader);
  return headers.find(h => normalizeHeader(h) === normalizedTarget);
};

// Check if a header exists in CSV headers using case-insensitive matching
export const hasHeader = (headers: string[], targetHeader: string): boolean => {
  return findHeader(headers, targetHeader) !== undefined;
};

// Helper to check for Partner Code logic (case-insensitive)
export const hasPartnerCodeColumns = (headers: string[]) => {
    if (hasHeader(headers, "Partner Code")) return true;
    if (hasHeader(headers, "Code") && hasHeader(headers, "Partner")) return true;
    return false;
};

// Get value from row using pre-computed header map (O(1) lookup)
const getRowValueFromMap = (row: any, headerMap: HeaderMap, targetHeader: string): any => {
  const actualHeader = headerMap.get(normalizeHeader(targetHeader));
  return actualHeader ? row[actualHeader] : undefined;
};

// Get value from row using case-insensitive header matching (for external use)
export const getRowValue = (row: any, headers: string[], targetHeader: string): any => {
  const actualHeader = findHeader(headers, targetHeader);
  return actualHeader ? row[actualHeader] : undefined;
};

const mapCsvRowToRecord = (row: any, headerMap: HeaderMap): Omit<DeveloperRecord, 'id'> => {
  // Logic to resolve partner code (case-insensitive)
  let partnerCode = 'UNKNOWN';
  const partnerCodeValue = getRowValueFromMap(row, headerMap, 'Partner Code');
  const codeValue = getRowValueFromMap(row, headerMap, 'Code');
  
  if (partnerCodeValue) {
      partnerCode = partnerCodeValue;
  } else if (codeValue) {
      partnerCode = codeValue;
  }

  const acceptedMembershipValue = getRowValueFromMap(row, headerMap, 'Accepted Membership');
  const acceptedMarketingValue = getRowValueFromMap(row, headerMap, 'Accepted Marketing');

  return {
    email: getRowValueFromMap(row, headerMap, 'Email') || '',
    firstName: getRowValueFromMap(row, headerMap, 'First Name') || '',
    lastName: getRowValueFromMap(row, headerMap, 'Last Name') || '',
    phone: getRowValueFromMap(row, headerMap, 'Phone Number') || '',
    country: getRowValueFromMap(row, headerMap, 'Country') || '',
    acceptedMembership: String(acceptedMembershipValue).toLowerCase() === 'true' || acceptedMembershipValue === '1',
    acceptedMarketing: String(acceptedMarketingValue).toLowerCase() === 'true' || acceptedMarketingValue === '1',
    walletAddress: getRowValueFromMap(row, headerMap, 'Wallet Address') || '',
    partnerCode: partnerCode,
    percentageCompleted: Number(getRowValueFromMap(row, headerMap, 'Percentage Completed')) || 0,
    createdAt: getRowValueFromMap(row, headerMap, 'Created At') || new Date().toISOString(),
    completedAt: getRowValueFromMap(row, headerMap, 'Completed At') || null,
    finalScore: Number(getRowValueFromMap(row, headerMap, 'Final Score')) || 0,
    finalGrade: (getRowValueFromMap(row, headerMap, 'Final Grade') as any) || 'Pending',
    caStatus: getRowValueFromMap(row, headerMap, 'CA Status') || '',
  };
};

// Process parsed CSV data into CsvImportResult
const processParsedData = (results: Papa.ParseResult<any>): CsvImportResult => {
  const headers = results.meta.fields || [];

  // Check Core Headers (case-insensitive)
  const missingHeaders = REQUIRED_HEADERS_CORE.filter(h => !hasHeader(headers, h));

  // Check Partner/Code logic (case-insensitive)
  if (!hasPartnerCodeColumns(headers)) {
      missingHeaders.push("Partner Code (or 'Partner' and 'Code' columns)");
  }

  if (missingHeaders.length > 0) {
    return {
      validRecords: [],
      errors: [`Missing required columns: ${missingHeaders.join(', ')}`]
    };
  }

  // Pre-compute header map for O(1) lookups during row processing
  const headerMap = buildHeaderMap(headers);

  const validRecords: Omit<DeveloperRecord, 'id'>[] = [];
  const errors: string[] = [];

  results.data.forEach((row: any, index) => {
     // Basic validation (case-insensitive)
     const emailValue = getRowValueFromMap(row, headerMap, 'Email');
     if (!emailValue) {
         errors.push(`Row ${index + 2}: Missing Email`);
         return;
     }

     try {
         const record = mapCsvRowToRecord(row, headerMap);
         validRecords.push(record);
     } catch (e) {
         errors.push(`Row ${index + 2}: Error parsing data`);
     }
  });

  return { validRecords, errors };
};

export const csvService = {
  parseCsv: (file: File): Promise<CsvImportResult> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(processParsedData(results));
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  },

  /**
   * Parses a CSV string directly (useful for testing).
   */
  parseString: (csvString: string): CsvImportResult => {
    const results = Papa.parse(csvString, { header: true, skipEmptyLines: true });
    return processParsedData(results);
  }
};
