import Papa from 'papaparse';
import { Community, CommunityImportResult } from '../types';

/**
 * Service for parsing community/partner CSV files with flexible column detection.
 * 
 * Supports:
 * - Single column files (treated as identifier/name)
 * - Multi-column files (identifier detected by header or position)
 * - Optional header row detection
 * - Normalization of identifiers (trim, collapse spaces, handle encodings)
 * - Storing extra columns as metadata
 */

/**
 * Creates a normalized slug from a display name.
 * Used for deduplication and as a unique key.
 */
export const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Normalizes a community name by trimming whitespace,
 * collapsing multiple spaces, and handling common encoding issues.
 * 
 * Note: The replacement character (U+FFFD '�') handling addresses
 * common issues when CSV files are saved with different encodings
 * (e.g., Latin-1 to UTF-8 conversion artifacts).
 */
export const normalizeName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    // Handle Unicode replacement character (common encoding artifact)
    // This appears when characters from other encodings can't be decoded as UTF-8
    .replace(/\uFFFD/g, '?')
    // Also handle the literal bytes that may appear as � in some contexts
    .replace(/�/g, '?')
    // Remove null bytes
    .replace(/\0/g, '');
};

/**
 * Detects if the first row is likely a header row.
 * Heuristics:
 * - Contains common header keywords like "code", "name", "community", "partner"
 * - Values are not purely numeric
 */
export const detectHeader = (firstRow: string[]): boolean => {
  const headerKeywords = ['code', 'name', 'community', 'partner', 'id', 'identifier', 'label', 'type', 'country', 'region'];
  
  for (const value of firstRow) {
    if (!value) continue;
    const lower = value.toLowerCase().trim();
    if (headerKeywords.some(keyword => lower.includes(keyword))) {
      return true;
    }
  }
  
  return false;
};

/**
 * Identifies which column should be used as the community identifier.
 * Rules:
 * - If there's only one column, use it
 * - If headers exist, look for columns containing "code", "name", or "community"
 * - Otherwise, use the first column
 */
export const findIdentifierColumn = (headers: string[]): number => {
  if (headers.length === 1) return 0;
  
  const identifierKeywords = ['code', 'name', 'community', 'partner', 'id', 'identifier', 'label'];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();
    if (identifierKeywords.some(keyword => header.includes(keyword))) {
      return i;
    }
  }
  
  // Default to first column
  return 0;
};

export interface ParseOptions {
  /** Force treating first row as header (undefined = auto-detect) */
  firstRowIsHeader?: boolean;
  /** Column index to use as identifier (undefined = auto-detect) */
  identifierColumn?: number;
}

/**
 * Parses a CSV file containing community/partner data.
 * Returns structured result with valid entries, skipped rows, and errors.
 */
export const communityCsvService = {
  parseCsv: (file: File, options: ParseOptions = {}): Promise<CommunityImportResult> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsed = processParseResults(results.data as string[][], options);
            resolve(parsed);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error, { filename: file.name, size: file.size });
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  },
  
  /**
   * Parses a CSV string directly (useful for testing).
   */
  parseString: (csvString: string, options: ParseOptions = {}): CommunityImportResult => {
    const results = Papa.parse(csvString, { skipEmptyLines: true });
    return processParseResults(results.data as string[][], options);
  }
};

/**
 * Processes parsed CSV data into a CommunityImportResult.
 */
function processParseResults(data: string[][], options: ParseOptions): CommunityImportResult {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      validEntries: 0,
      skippedRows: 0,
      errors: [{ row: 0, reason: 'File is empty' }],
      imported: []
    };
  }
  
  // Determine if first row is a header
  const hasHeader = options.firstRowIsHeader ?? detectHeader(data[0]);
  
  // Get headers (column names) for metadata
  const headerRow = hasHeader ? data[0] : data[0].map((_, i) => `column_${i + 1}`);
  
  // Find identifier column
  const identifierColumnIndex = options.identifierColumn ?? findIdentifierColumn(headerRow);
  
  // Data rows (skip header if present)
  const dataRows = hasHeader ? data.slice(1) : data;
  
  const result: CommunityImportResult = {
    totalRows: dataRows.length,
    validEntries: 0,
    skippedRows: 0,
    errors: [],
    imported: []
  };
  
  // Track slugs to prevent duplicates within the same import
  const seenSlugs = new Set<string>();
  
  const now = new Date().toISOString();
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = hasHeader ? i + 2 : i + 1; // Account for header row in line numbers
    
    // Get identifier value
    const identifierValue = row[identifierColumnIndex];
    
    // Validate identifier
    if (!identifierValue || identifierValue.trim() === '') {
      result.errors.push({ row: rowNumber, reason: 'Empty identifier value' });
      result.skippedRows++;
      continue;
    }
    
    const displayName = normalizeName(identifierValue);
    const slug = createSlug(displayName);
    
    // Check for empty slug (could happen with special characters only)
    if (!slug) {
      result.errors.push({ row: rowNumber, reason: `Invalid identifier after normalization: "${identifierValue}"` });
      result.skippedRows++;
      continue;
    }
    
    // Check for duplicate within this import batch
    if (seenSlugs.has(slug)) {
      result.errors.push({ row: rowNumber, reason: `Duplicate entry: "${displayName}"` });
      result.skippedRows++;
      continue;
    }
    
    seenSlugs.add(slug);
    
    // Build metadata from extra columns
    const metadata: Record<string, string> = {};
    for (let j = 0; j < row.length; j++) {
      if (j !== identifierColumnIndex && row[j]) {
        const key = headerRow[j] || `column_${j + 1}`;
        metadata[key] = normalizeName(row[j]);
      }
    }
    
    const community: Omit<Community, 'id'> = {
      displayName,
      slug,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      createdAt: now,
      updatedAt: now
    };
    
    result.imported.push(community);
    result.validEntries++;
  }
  
  return result;
}

export default communityCsvService;
