import { describe, it, expect } from 'vitest';
import {
  communityCsvService,
  createSlug,
  normalizeName,
  detectHeader,
  findIdentifierColumn
} from '../communityCsvService';

describe('communityCsvService utilities', () => {
  describe('createSlug', () => {
    it('should convert to lowercase and replace spaces with hyphens', () => {
      expect(createSlug('Dar Blockchain')).toBe('dar-blockchain');
    });

    it('should remove special characters', () => {
      expect(createSlug('Web3@Afrika!')).toBe('web3afrika');
    });

    it('should handle already lowercase names', () => {
      expect(createSlug('darblockchain')).toBe('darblockchain');
    });

    it('should collapse multiple spaces and hyphens', () => {
      expect(createSlug('Dar   Blockchain--Test')).toBe('dar-blockchain-test');
    });

    it('should trim whitespace', () => {
      expect(createSlug('  Dar Blockchain  ')).toBe('dar-blockchain');
    });

    it('should handle special community names', () => {
      expect(createSlug('ODCMALI')).toBe('odcmali');
      expect(createSlug('DarTAKSIR')).toBe('dartaksir');
      expect(createSlug('BRCommunity')).toBe('brcommunity');
    });
  });

  describe('normalizeName', () => {
    it('should trim whitespace', () => {
      expect(normalizeName('  Dar Blockchain  ')).toBe('Dar Blockchain');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeName('Dar    Blockchain')).toBe('Dar Blockchain');
    });

    it('should handle encoding issues', () => {
      expect(normalizeName('solidarit�la�que')).toBe('solidarit?la?que');
    });

    it('should handle empty strings', () => {
      expect(normalizeName('')).toBe('');
    });

    it('should handle null/undefined gracefully', () => {
      expect(normalizeName(null as unknown as string)).toBe('');
      expect(normalizeName(undefined as unknown as string)).toBe('');
    });
  });

  describe('detectHeader', () => {
    it('should detect "Code" header', () => {
      expect(detectHeader(['Code'])).toBe(true);
    });

    it('should detect "name" header (case insensitive)', () => {
      expect(detectHeader(['NAME'])).toBe(true);
      expect(detectHeader(['Name'])).toBe(true);
    });

    it('should detect "community" header', () => {
      expect(detectHeader(['Community Name', 'Country'])).toBe(true);
    });

    it('should not detect data rows as headers', () => {
      expect(detectHeader(['darblockchain'])).toBe(false);
      expect(detectHeader(['ODCMALI'])).toBe(false);
    });

    it('should detect "partner" header', () => {
      expect(detectHeader(['Partner Code'])).toBe(true);
    });

    it('should detect identifier in any column', () => {
      expect(detectHeader(['Country', 'Code', 'Region'])).toBe(true);
    });
  });

  describe('findIdentifierColumn', () => {
    it('should return 0 for single column', () => {
      expect(findIdentifierColumn(['Code'])).toBe(0);
    });

    it('should find column with "code"', () => {
      expect(findIdentifierColumn(['Country', 'Partner Code', 'Region'])).toBe(1);
    });

    it('should find column with "name"', () => {
      expect(findIdentifierColumn(['Type', 'Community Name', 'Contact'])).toBe(1);
    });

    it('should find column with "community"', () => {
      expect(findIdentifierColumn(['Region', 'Community', 'Manager'])).toBe(1);
    });

    it('should default to first column if no identifier found', () => {
      expect(findIdentifierColumn(['Column A', 'Column B', 'Column C'])).toBe(0);
    });
  });
});

describe('communityCsvService.parseString', () => {
  describe('single column CSV', () => {
    it('should parse single column with header', () => {
      const csv = `Code
darblockchain
ODCMALI
Web3Afrika`;
      
      const result = communityCsvService.parseString(csv);
      
      expect(result.totalRows).toBe(3);
      expect(result.validEntries).toBe(3);
      expect(result.skippedRows).toBe(0);
      expect(result.imported.length).toBe(3);
      expect(result.imported[0].displayName).toBe('darblockchain');
      expect(result.imported[0].slug).toBe('darblockchain');
    });

    it('should parse single column without header', () => {
      const csv = `darblockchain
ODCMALI
Web3Afrika`;
      
      const result = communityCsvService.parseString(csv, { firstRowIsHeader: false });
      
      expect(result.totalRows).toBe(3);
      expect(result.validEntries).toBe(3);
      expect(result.imported[0].displayName).toBe('darblockchain');
    });

    it('should handle the community list sample data', () => {
      // Note: darblockchain and Darblockchain are duplicates (same slug), so one will be skipped
      const csv = `Code
darblockchain
Darblockchain
ODCMALI
ODCSENEGAL
ODCSIERRALEONE
ODCBOTSWANA
ODCMADAGASCAR
DarTAKSIR
DarPrinceKayenga
Eyouth
DarGraystaoshi
BRCommunity
Web3Afrika
universiapolis`;

      const result = communityCsvService.parseString(csv);
      
      // 13 valid because darblockchain and Darblockchain have the same slug
      expect(result.validEntries).toBe(13);
      // 1 duplicate skipped
      expect(result.skippedRows).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].reason).toContain('Duplicate');
    });
  });

  describe('duplicate handling', () => {
    it('should skip duplicate entries within same import', () => {
      const csv = `Code
darblockchain
darblockchain
DarBlockchain`;

      const result = communityCsvService.parseString(csv);
      
      // First entry is valid, second two are duplicates (same slug)
      expect(result.validEntries).toBe(1);
      expect(result.skippedRows).toBe(2);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0].reason).toContain('Duplicate');
    });
  });

  describe('multi-column CSV', () => {
    it('should parse multi-column with extra metadata', () => {
      const csv = `Code,Country,Type
darblockchain,Tunisia,Blockchain
Web3Afrika,Kenya,Web3`;

      const result = communityCsvService.parseString(csv);
      
      expect(result.validEntries).toBe(2);
      expect(result.imported[0].displayName).toBe('darblockchain');
      expect(result.imported[0].metadata).toEqual({
        Country: 'Tunisia',
        Type: 'Blockchain'
      });
    });

    it('should identify identifier column by header', () => {
      const csv = `Country,Partner Name,Contact
Tunisia,Dar Blockchain,admin@dar.tn
Kenya,Web3 Afrika,info@web3.ke`;

      const result = communityCsvService.parseString(csv);
      
      expect(result.validEntries).toBe(2);
      expect(result.imported[0].displayName).toBe('Dar Blockchain');
      expect(result.imported[0].metadata?.Country).toBe('Tunisia');
    });
  });

  describe('error handling', () => {
    it('should handle empty rows', () => {
      const csv = `Code
darblockchain

Web3Afrika`;

      const result = communityCsvService.parseString(csv);
      
      // Empty row is skipped by Papa.parse with skipEmptyLines
      expect(result.validEntries).toBe(2);
    });

    it('should handle rows with empty identifier', () => {
      const csv = `Code,Country
,Tunisia
darblockchain,Tunisia`;

      const result = communityCsvService.parseString(csv);
      
      expect(result.validEntries).toBe(1);
      expect(result.skippedRows).toBe(1);
      expect(result.errors[0].reason).toContain('Empty identifier');
    });

    it('should handle completely empty file', () => {
      const csv = '';
      
      const result = communityCsvService.parseString(csv);
      
      expect(result.validEntries).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].reason).toContain('empty');
    });

    it('should handle rows with only special characters', () => {
      const csv = `Code
@#$%^&*
darblockchain`;

      const result = communityCsvService.parseString(csv);
      
      expect(result.validEntries).toBe(1);
      expect(result.skippedRows).toBe(1);
      expect(result.errors[0].reason).toContain('Invalid identifier');
    });
  });

  describe('header toggle option', () => {
    it('should force first row as data when firstRowIsHeader is false', () => {
      const csv = `Code
darblockchain`;

      const result = communityCsvService.parseString(csv, { firstRowIsHeader: false });
      
      // "Code" should be treated as data
      expect(result.validEntries).toBe(2);
      expect(result.imported[0].displayName).toBe('Code');
    });

    it('should force first row as header when firstRowIsHeader is true', () => {
      const csv = `darblockchain
Web3Afrika`;

      const result = communityCsvService.parseString(csv, { firstRowIsHeader: true });
      
      // "darblockchain" is treated as header, only Web3Afrika is data
      expect(result.validEntries).toBe(1);
      expect(result.imported[0].displayName).toBe('Web3Afrika');
    });
  });

  describe('encoding issues', () => {
    it('should handle names with encoding artifacts', () => {
      const csv = `Code
solidarit�la�que
normalname`;

      const result = communityCsvService.parseString(csv);
      
      expect(result.validEntries).toBe(2);
      expect(result.imported[0].displayName).toBe('solidarit?la?que');
    });
  });
});
