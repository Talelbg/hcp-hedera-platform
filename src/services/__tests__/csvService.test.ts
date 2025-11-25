import { describe, it, expect } from 'vitest';
import { csvService, normalizeHeader, findHeader, hasHeader, hasPartnerCodeColumns } from '../csvService';

describe('csvService utilities', () => {
  describe('normalizeHeader', () => {
    it('should convert to lowercase and trim', () => {
      expect(normalizeHeader('  Phone Number  ')).toBe('phone number');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeHeader('Phone   Number')).toBe('phone number');
    });

    it('should handle mixed case', () => {
      expect(normalizeHeader('PHONE NUMBER')).toBe('phone number');
      expect(normalizeHeader('Phone Number')).toBe('phone number');
      expect(normalizeHeader('phone number')).toBe('phone number');
    });
  });

  describe('findHeader', () => {
    it('should find header regardless of case', () => {
      const headers = ['EMAIL', 'First Name', 'phone number'];
      expect(findHeader(headers, 'Email')).toBe('EMAIL');
      expect(findHeader(headers, 'FIRST NAME')).toBe('First Name');
      expect(findHeader(headers, 'Phone Number')).toBe('phone number');
    });

    it('should return undefined for missing headers', () => {
      const headers = ['Email', 'First Name'];
      expect(findHeader(headers, 'Phone Number')).toBeUndefined();
    });

    it('should handle headers with extra spaces', () => {
      const headers = ['Phone  Number', 'First   Name'];
      expect(findHeader(headers, 'Phone Number')).toBe('Phone  Number');
      expect(findHeader(headers, 'First Name')).toBe('First   Name');
    });
  });

  describe('hasHeader', () => {
    it('should return true for matching headers (case-insensitive)', () => {
      const headers = ['email', 'FIRST NAME', 'Phone Number'];
      expect(hasHeader(headers, 'Email')).toBe(true);
      expect(hasHeader(headers, 'First Name')).toBe(true);
      expect(hasHeader(headers, 'phone number')).toBe(true);
    });

    it('should return false for missing headers', () => {
      const headers = ['Email', 'First Name'];
      expect(hasHeader(headers, 'Country')).toBe(false);
    });
  });

  describe('hasPartnerCodeColumns', () => {
    it('should detect "Partner Code" column (case-insensitive)', () => {
      expect(hasPartnerCodeColumns(['Partner Code', 'Other'])).toBe(true);
      expect(hasPartnerCodeColumns(['PARTNER CODE', 'Other'])).toBe(true);
      expect(hasPartnerCodeColumns(['partner code', 'Other'])).toBe(true);
    });

    it('should detect separate "Partner" and "Code" columns', () => {
      expect(hasPartnerCodeColumns(['Partner', 'Code', 'Other'])).toBe(true);
      expect(hasPartnerCodeColumns(['PARTNER', 'CODE', 'Other'])).toBe(true);
    });

    it('should return false when neither condition is met', () => {
      expect(hasPartnerCodeColumns(['Email', 'Name'])).toBe(false);
      expect(hasPartnerCodeColumns(['Partner', 'Name'])).toBe(false);
      expect(hasPartnerCodeColumns(['Email', 'Code'])).toBe(false);
    });
  });
});

describe('csvService.parseString', () => {
  describe('case-insensitive header matching', () => {
    it('should accept headers with different cases', () => {
      const csv = `email,first name,last name,phone number,country,accepted membership,accepted marketing,wallet address,partner,code,percentage completed,created at,completed at,final score,final grade,ca status
test@example.com,John,Doe,1234567890,USA,true,false,0x123,Partner1,CODE1,100,2024-01-01,2024-01-02,95,Pass,Active`;

      const result = csvService.parseString(csv);

      expect(result.errors.filter(e => e.includes('Missing required columns'))).toHaveLength(0);
      expect(result.validRecords).toHaveLength(1);
      expect(result.validRecords[0].email).toBe('test@example.com');
      expect(result.validRecords[0].firstName).toBe('John');
      expect(result.validRecords[0].phone).toBe('1234567890');
    });

    it('should accept UPPERCASE headers', () => {
      const csv = `EMAIL,FIRST NAME,LAST NAME,PHONE NUMBER,COUNTRY,ACCEPTED MEMBERSHIP,ACCEPTED MARKETING,WALLET ADDRESS,PARTNER,CODE,PERCENTAGE COMPLETED,CREATED AT,COMPLETED AT,FINAL SCORE,FINAL GRADE,CA STATUS
test@example.com,Jane,Smith,9876543210,UK,true,true,0x456,Partner2,CODE2,80,2024-02-01,2024-02-15,88,Pass,Completed`;

      const result = csvService.parseString(csv);

      expect(result.errors.filter(e => e.includes('Missing required columns'))).toHaveLength(0);
      expect(result.validRecords).toHaveLength(1);
      expect(result.validRecords[0].email).toBe('test@example.com');
      expect(result.validRecords[0].lastName).toBe('Smith');
    });

    it('should accept headers with extra spaces', () => {
      const csv = `Email,First  Name,Last  Name,Phone  Number,Country,Accepted  Membership,Accepted  Marketing,Wallet  Address,Partner,Code,Percentage  Completed,Created  At,Completed  At,Final  Score,Final  Grade,CA  Status
test@example.com,Bob,Johnson,5555555555,Canada,false,true,0x789,Partner3,CODE3,50,2024-03-01,,70,Pending,In Progress`;

      const result = csvService.parseString(csv);

      expect(result.errors.filter(e => e.includes('Missing required columns'))).toHaveLength(0);
      expect(result.validRecords).toHaveLength(1);
    });

    it('should accept mixed case and spacing in headers', () => {
      const csv = `EMAIL,first name,LAST NAME,phone number,Country,accepted membership,Accepted Marketing,wallet address,partner,code,percentage completed,created at,Completed At,FINAL SCORE,Final Grade,ca status
user@test.com,Alice,Wonder,1111111111,Germany,true,false,0xabc,PartnerX,CODEX,65,2024-04-01,2024-04-20,75,Pass,Done`;

      const result = csvService.parseString(csv);

      expect(result.errors.filter(e => e.includes('Missing required columns'))).toHaveLength(0);
      expect(result.validRecords).toHaveLength(1);
    });
  });

  describe('Partner Code handling', () => {
    it('should handle Partner Code as single column', () => {
      const csv = `Email,First Name,Last Name,Phone Number,Country,Accepted Membership,Accepted Marketing,Wallet Address,Partner Code,Percentage Completed,Created At,Completed At,Final Score,Final Grade,CA Status
test@example.com,Test,User,1234567890,France,true,true,0xdef,PARTNER-CODE-123,90,2024-05-01,2024-05-10,92,Pass,Complete`;

      const result = csvService.parseString(csv);

      expect(result.errors.filter(e => e.includes('Missing required columns'))).toHaveLength(0);
      expect(result.validRecords).toHaveLength(1);
      expect(result.validRecords[0].partnerCode).toBe('PARTNER-CODE-123');
    });

    it('should handle partner code with different cases', () => {
      const csv = `Email,First Name,Last Name,Phone Number,Country,Accepted Membership,Accepted Marketing,Wallet Address,PARTNER CODE,Percentage Completed,Created At,Completed At,Final Score,Final Grade,CA Status
test@example.com,Test,User,1234567890,Spain,false,false,0xghi,MY-PARTNER,100,2024-06-01,2024-06-15,98,Pass,Verified`;

      const result = csvService.parseString(csv);

      expect(result.errors.filter(e => e.includes('Missing required columns'))).toHaveLength(0);
      expect(result.validRecords).toHaveLength(1);
      expect(result.validRecords[0].partnerCode).toBe('MY-PARTNER');
    });

    it('should use Code column when Partner Code is not present', () => {
      const csv = `Email,First Name,Last Name,Phone Number,Country,Accepted Membership,Accepted Marketing,Wallet Address,Partner,Code,Percentage Completed,Created At,Completed At,Final Score,Final Grade,CA Status
test@example.com,Test,User,1234567890,Italy,true,true,0xjkl,MyPartner,ACTUAL-CODE,80,2024-07-01,2024-07-20,85,Pass,Done`;

      const result = csvService.parseString(csv);

      expect(result.errors.filter(e => e.includes('Missing required columns'))).toHaveLength(0);
      expect(result.validRecords).toHaveLength(1);
      expect(result.validRecords[0].partnerCode).toBe('ACTUAL-CODE');
    });
  });

  describe('error handling', () => {
    it('should report missing columns correctly', () => {
      const csv = `Email,First Name,Country
test@example.com,John,USA`;

      const result = csvService.parseString(csv);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required columns');
      expect(result.validRecords).toHaveLength(0);
    });

    it('should report missing email for invalid rows', () => {
      const csv = `Email,First Name,Last Name,Phone Number,Country,Accepted Membership,Accepted Marketing,Wallet Address,Partner,Code,Percentage Completed,Created At,Completed At,Final Score,Final Grade,CA Status
,John,Doe,1234567890,USA,true,false,0x123,Partner1,CODE1,100,2024-01-01,2024-01-02,95,Pass,Active
test@example.com,Jane,Smith,9876543210,UK,true,true,0x456,Partner2,CODE2,80,2024-02-01,2024-02-15,88,Pass,Completed`;

      const result = csvService.parseString(csv);

      expect(result.validRecords).toHaveLength(1);
      expect(result.errors).toContain('Row 2: Missing Email');
    });
  });

  describe('boolean field parsing', () => {
    it('should correctly parse boolean fields', () => {
      const csv = `Email,First Name,Last Name,Phone Number,Country,Accepted Membership,Accepted Marketing,Wallet Address,Partner Code,Percentage Completed,Created At,Completed At,Final Score,Final Grade,CA Status
test1@example.com,User1,Test,111,USA,true,false,0x1,P1,50,2024-01-01,,50,Pending,Active
test2@example.com,User2,Test,222,UK,1,0,0x2,P2,60,2024-01-02,,60,Pending,Active
test3@example.com,User3,Test,333,CA,TRUE,FALSE,0x3,P3,70,2024-01-03,,70,Pending,Active`;

      const result = csvService.parseString(csv);

      expect(result.validRecords).toHaveLength(3);
      expect(result.validRecords[0].acceptedMembership).toBe(true);
      expect(result.validRecords[0].acceptedMarketing).toBe(false);
      expect(result.validRecords[1].acceptedMembership).toBe(true);
      expect(result.validRecords[1].acceptedMarketing).toBe(false);
      expect(result.validRecords[2].acceptedMembership).toBe(true);
      expect(result.validRecords[2].acceptedMarketing).toBe(false);
    });
  });
});
