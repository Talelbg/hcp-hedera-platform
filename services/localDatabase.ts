
import { 
    DatasetVersion, 
    Invoice, 
    CommunityAgreement, 
    CommunityEvent, 
    OutreachCampaign, 
    AdminUser, 
    CommunityMasterRecord 
} from '../types';
import { MOCK_ADMIN_TEAM } from '../constants';

// KEYS FOR LOCAL STORAGE (Small Data Entities)
const KEYS = {
    INVOICES: 'hcp_invoices',
    AGREEMENTS: 'hcp_agreements',
    EVENTS: 'hcp_events',
    CAMPAIGNS: 'hcp_campaigns',
    ADMINS: 'hcp_admins',
    REGISTRY: 'hcp_registry'
};

// INDEXED DB CONFIG (Large Data Entities)
const DB_NAME = 'HCP_DB';
const DB_VERSION = 1;
const STORE_DATASETS = 'datasets';

class LocalDatabaseService {
    
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        // Initialize IndexedDB
        this.dbPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                // Fallback for environments without IndexedDB
                return;
            }
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error("IndexedDB failed to open:", request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_DATASETS)) {
                    // Create object store for datasets with 'id' as key
                    db.createObjectStore(STORE_DATASETS, { keyPath: 'id' });
                }
            };
        });
    }

    // --- DATASET VERSIONING (IndexedDB) ---
    
    async saveDatasetVersion(version: DatasetVersion): Promise<void> {
        try {
            const db = await this.dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_DATASETS], 'readwrite');
                const store = transaction.objectStore(STORE_DATASETS);
                const request = store.put(version); // put() adds or updates
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("LocalDB: Failed to save dataset version to IndexedDB", e);
            throw e;
        }
    }

    async getDatasetVersions(): Promise<DatasetVersion[]> {
        try {
            const db = await this.dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_DATASETS], 'readonly');
                const store = transaction.objectStore(STORE_DATASETS);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const res = request.result as DatasetVersion[];
                    // Sort by uploadDate descending (newest first)
                    res.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
                    resolve(res);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("LocalDB: Failed to load datasets from IndexedDB", e);
            return [];
        }
    }

    async deleteDatasetVersion(id: string): Promise<void> {
        try {
            const db = await this.dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_DATASETS], 'readwrite');
                const store = transaction.objectStore(STORE_DATASETS);
                const request = store.delete(id);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("LocalDB: Failed to delete dataset", e);
            throw e;
        }
    }

    // --- APP STATE PERSISTENCE (LocalStorage) ---
    // Used for smaller configuration objects
    
    private saveItem<T>(key: string, data: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`LocalDB: Error saving ${key} to localStorage`, e);
        }
    }

    private loadItem<T>(key: string, fallback: T): T {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    // --- SPECIFIC ENTITY METHODS ---

    // ADMINS
    getAdmins(): AdminUser[] {
        return this.loadItem<AdminUser[]>(KEYS.ADMINS, MOCK_ADMIN_TEAM);
    }
    saveAdmins(admins: AdminUser[]) {
        this.saveItem(KEYS.ADMINS, admins);
    }

    // INVOICES
    getInvoices(): Invoice[] {
        return this.loadItem<Invoice[]>(KEYS.INVOICES, []);
    }
    saveInvoices(invoices: Invoice[]) {
        this.saveItem(KEYS.INVOICES, invoices);
    }

    // AGREEMENTS
    getAgreements(): CommunityAgreement[] {
        return this.loadItem<CommunityAgreement[]>(KEYS.AGREEMENTS, []);
    }
    saveAgreements(agreements: CommunityAgreement[]) {
        this.saveItem(KEYS.AGREEMENTS, agreements);
    }

    // EVENTS
    getEvents(): CommunityEvent[] {
        return this.loadItem<CommunityEvent[]>(KEYS.EVENTS, []);
    }
    saveEvents(events: CommunityEvent[]) {
        this.saveItem(KEYS.EVENTS, events);
    }

    // CAMPAIGNS
    getCampaigns(): OutreachCampaign[] {
        return this.loadItem<OutreachCampaign[]>(KEYS.CAMPAIGNS, []);
    }
    saveCampaigns(campaigns: OutreachCampaign[]) {
        this.saveItem(KEYS.CAMPAIGNS, campaigns);
    }

    // MASTER REGISTRY
    getMasterRegistry(): CommunityMasterRecord[] {
        return this.loadItem<CommunityMasterRecord[]>(KEYS.REGISTRY, []);
    }
    saveMasterRegistry(registry: CommunityMasterRecord[]) {
        this.saveItem(KEYS.REGISTRY, registry);
    }
}

export const LocalDB = new LocalDatabaseService();
