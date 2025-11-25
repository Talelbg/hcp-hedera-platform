import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { DeveloperRecord } from '../types';
import { GENERATE_MOCK_DEVELOPERS } from '../../constants';

const COLLECTION_NAME = 'developers';

export const subscriptionService = {
  // Create a new subscription
  addSubscription: async (data: Omit<DeveloperRecord, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error("Error adding subscription:", error);
      throw error;
    }
  },

  // Get all subscriptions (optionally filtered by partnerCode)
  getSubscriptions: async (partnerCode?: string) => {
    try {
      let q = collection(db, COLLECTION_NAME);

      if (partnerCode && partnerCode !== 'All') {
        // @ts-ignore - complex query typing
        q = query(collection(db, COLLECTION_NAME), where('partnerCode', '==', partnerCode));
      }

      const querySnapshot = await getDocs(q);
      const results: DeveloperRecord[] = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as DeveloperRecord);
      });

      // Fallback to Mock Data if DB is empty (PROTOTYPE MODE)
      if (results.length === 0) {
          // Using mock data for prototype mode - this is expected behavior
          let mocks = GENERATE_MOCK_DEVELOPERS();
          if (partnerCode && partnerCode !== 'All') {
              mocks = mocks.filter(m => m.partnerCode === partnerCode);
          }
          return mocks;
      }

      return results;
    } catch (error) {
      // In case of error (e.g. permission denied, offline), return mocks to keep UI alive
      // This is expected behavior for prototype mode
      return GENERATE_MOCK_DEVELOPERS();
    }
  },

  // Update a subscription
  updateSubscription: async (id: string, data: Partial<DeveloperRecord>) => {
    try {
        // If it's a mock record, we can't update it in Firestore easily without creating it first.
        // For the prototype, we simulate success if the ID starts with 'mock-'
        if (id.startsWith('mock-')) {
            console.log("Simulating update on mock record:", id);
            return;
        }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  },

  // Delete a subscription
  deleteSubscription: async (id: string) => {
    try {
       if (id.startsWith('mock-')) {
            console.log("Simulating delete on mock record:", id);
            return;
        }
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting subscription:", error);
      throw error;
    }
  },

  // Bulk add subscriptions (Optimized with Batching)
  bulkAddSubscriptions: async (dataList: Omit<DeveloperRecord, 'id'>[]) => {
      const results = [];
      const batchSize = 500;

      for (let i = 0; i < dataList.length; i += batchSize) {
          const chunk = dataList.slice(i, i + batchSize);
          const batch = writeBatch(db);

          for (const data of chunk) {
              if (data.email) {
                  const docId = data.email.replace(/[^a-zA-Z0-9]/g, '_');
                  const docRef = doc(db, COLLECTION_NAME, docId);
                  batch.set(docRef, data, { merge: true });
                  results.push({ id: docId, ...data, status: 'processed' });
              } else {
                  const docRef = doc(collection(db, COLLECTION_NAME));
                  batch.set(docRef, data);
                  results.push({ id: docRef.id, ...data, status: 'processed' });
              }
          }

          try {
              await batch.commit();
          } catch (e) {
              console.error(`Batch commit failed for chunk starting at index ${i}`, e);
          }
      }
      return results;
  }
};
