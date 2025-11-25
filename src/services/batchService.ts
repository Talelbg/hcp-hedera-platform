import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { DatasetBatch } from '../types';

const COLLECTION = 'batches';

export const batchService = {
  createBatch: async (fileName: string, recordCount: number, uploadedBy: string): Promise<DatasetBatch> => {
    const versionId = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const data = { fileName, uploadDate: new Date().toISOString(), uploadedBy, recordCount, versionId };
    const ref = await addDoc(collection(db, COLLECTION), data);
    return { id: ref.id, ...data };
  },

  getBatches: async (max = 20): Promise<DatasetBatch[]> => {
    const q = query(collection(db, COLLECTION), orderBy('uploadDate', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DatasetBatch));
  },
};

export default batchService;
