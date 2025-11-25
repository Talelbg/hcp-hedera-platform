// 1.1 Hierarchy & Permissions
export enum UserRole {
  SUPER_ADMIN = 'Super Admin (HQ)',
  REGIONAL_ADMIN = 'Regional Admin (Cluster)',
  COMMUNITY_ADMIN = 'Community Admin (Local)',
}

// Firebase Auth role for custom claims
export type FirebaseUserRole = 'super_admin' | 'regional' | 'community' | 'user';

// Users collection in Firestore
export interface FirestoreUser {
  uid: string;
  email: string;
  role: FirebaseUserRole;
  assignedPartnerCodes: string[]; // For Regional (List) or Community (Single)
  lastLogin: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedCodes: string[]; // For Regional (List) or Community (Single)
  lastLogin: string;
  status: 'Active' | 'Invited' | 'Disabled';
}

// Official Master List of Communities
export interface CommunityMasterRecord {
    code: string; // Primary Key e.g. HEDERA-FR-PARIS
    name: string; // e.g. Hedera Paris
    region: string; // e.g. EMEA
    managerEmail?: string;
}

// Flexible Community/Partner record for CSV imports
export interface Community {
    id: string;
    displayName: string; // Original community name from CSV (normalized)
    slug: string; // Normalized key for deduplication (lowercase, trimmed, no special chars)
    metadata?: Record<string, string>; // Extra CSV columns stored as key-value pairs
    createdAt: string;
    updatedAt: string;
}

// Result of a community CSV import operation
export interface CommunityImportResult {
    totalRows: number;
    validEntries: number;
    skippedRows: number;
    errors: { row: number; reason: string }[];
    imported: Omit<Community, 'id'>[];
}

// 2.1 The Master Data Schema
export interface DeveloperRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  acceptedMembership: boolean;
  acceptedMarketing: boolean;
  walletAddress: string;
  partnerCode: string;
  percentageCompleted: number;
  createdAt: string; // ISO String
  completedAt: string | null; // ISO String
  finalScore: number;
  finalGrade: 'Pass' | 'Fail' | 'Pending';
  caStatus: string;
  // Cloud Firestore indexed fields
  status?: 'registered' | 'in_progress' | 'completed' | 'certified';
  ingestionBatchId?: string;
  riskScore?: number;
  // Computed / Enrichment fields
  durationHours?: number;
  isSuspicious?: boolean;
  suspicionReason?: string;
  dataError?: boolean;
}

// Batches collection - Track CSV upload history
export interface DatasetBatch {
  id: string;
  fileName: string;
  uploadDate: string;
  uploadedBy: string; // User UID
  recordCount: number;
  versionId: string;
}

// New: Dataset Versioning
export interface DatasetVersion {
    id: string;
    fileName: string;
    uploadDate: string;
    recordCount: number;
    data: DeveloperRecord[];
}

// 3.2 Module B: Invoicing & Agreements
export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  VOID = 'Void'
}

export type PaymentModel = 'Per_Certification' | 'Fixed_Recurring';
export type BillingCycle = 'Monthly' | 'Bimonthly' | 'Quarterly';
export type Currency = 'HBAR' | 'USDC' | 'USD' | 'EUR';
export type PaymentMethod = 'Crypto_Wallet' | 'Bank_Transfer';

export interface CommunityAgreement {
    id: string;
    partnerCode: string;
    partnerName: string; // Display Name
    
    // Responsible Person / Admin Link
    contactName: string;
    contactEmail: string;
    assignedAdminId?: string; // Link to AdminUser

    // Billing Details
    billingAddress: string; // Or Wallet Address
    taxId?: string; // VAT or EIN

    // Contract Duration
    startDate: string;
    endDate: string;
    isActive: boolean;

    // Financials
    paymentModel: PaymentModel;
    unitPrice: number; // Cost per cert OR Fixed Amount
    currency: Currency;
    billingCycle: BillingCycle;
    preferredMethod: PaymentMethod;
    paymentTerms: 'Due on Receipt' | 'Net 15' | 'Net 30';
    
    walletAddress?: string; // If Crypto
    bankDetails?: string; // If Fiat
    
    // Context
    description: string;
    documents: string[]; // Array of file names/links

    lastUpdated: string;
}

export interface InvoiceLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2024-001
  partnerCode: string;
  billingPeriod: string; // e.g., "2023-10"
  
  issueDate: string;
  dueDate: string;

  // Financials
  currency: Currency;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number; // Percentage
  taxAmount: number;
  totalAmount: number;

  // Metadata
  status: InvoiceStatus;
  notes: string; // Argumentation / Private Notes
  publicMemo: string; // Visible to client
  
  // Payment Proof
  paidAt?: string;
  transactionReference?: string; // Hash or Bank Ref
}

// 3.3 Module C: Events
export interface CommunityEvent {
  id: string;
  title: string;
  objective: string; // NEW: Event Objective
  date: string;
  startTime?: string; // NEW: Start Time
  endTime?: string;   // NEW: End Time
  format: 'Online' | 'In-Person'; // NEW: Format
  meetingLink?: string; // NEW: For online
  location: string; // Physical address or "Online"
  partnerCode: string;
  facilitators: string[]; // NEW: Engaged persons (Array)
  invitedCount: number;
  rsvpedCount: number;
  checkedInCount: number;
}

// 4.1 AI Insights
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

export interface ChartDataPoint {
  name: string;
  registrations: number;
  certifications: number;
}

// NEW: Membership Metrics
export interface MembershipMetrics {
    totalEnrolled: number; // Total developers in database/filter
    totalMembers: number; // acceptedMembership = true
    membershipRate: number; // members / enrolled %
    certifiedMembers: number; // members who also passed
    certifiedMemberRate: number; // certified members / total members %
    activeCommunities: number;
}

export interface MembershipChartPoint {
    name: string;
    enrollees: number;
    newMembers: number;
}

// Timeframe Filter Types
export type TimeframeOption = 'All Time' | 'This Year' | 'Last 90 Days' | 'Last 30 Days' | 'Custom Range';

export interface DateRange {
    start: Date | null;
    end: Date | null;
}

// NEW: Smart Outreach Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // Supports {{firstName}}, {{partnerCode}}, {{percentage}}
  trigger: 'Manual' | 'Automated';
}

export interface OutreachCampaign {
  id: string;
  name: string;
  audienceSize: number;
  sentCount: number;
  status: 'Draft' | 'Sending' | 'Completed';
  sentAt: string;
  templateId: string;
}

// NEW: Reporting Context
export interface ReportingContext {
    current: DashboardMetrics;
    prev: DashboardMetrics;
    global: DashboardMetrics;
}

// Firestore Campaign collection
export interface Campaign {
  id: string;
  templateId: string;
  targetAudienceFilter: {
    partnerCode?: string;
    status?: string;
    percentageMin?: number;
    percentageMax?: number;
  };
  sentAt: string;
  status: 'Draft' | 'Sending' | 'Completed' | 'Failed';
  recipientCount: number;
}

// Enhanced Events collection for Firestore
export interface FirestoreEvent {
  id: string;
  title: string;
  objective: string;
  date: string;
  startTime?: string;
  endTime?: string;
  format: 'Online' | 'In-Person';
  meetingLink?: string;
  location: string;
  partnerCode: string;
  facilitators: string[];
  attendeesCount: number;
  invitedCount: number;
  rsvpedCount: number;
  checkedInCount: number;
  createdAt: string;
  updatedAt: string;
}
