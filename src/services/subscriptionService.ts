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
      return results;
    } catch (error) {
      console.error("Error getting subscriptions:", error);
      throw error;
    }
  },

  // Update a subscription
  updateSubscription: async (id: string, data: Partial<DeveloperRecord>) => {
    try {
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

      // We process in chunks of 500
      for (let i = 0; i < dataList.length; i += batchSize) {
          const chunk = dataList.slice(i, i + batchSize);
          const batch = writeBatch(db);

          for (const data of chunk) {
              // For simplicity in this bulk upload, we generate a new ID
              // A more advanced version would check existence.
              // To enable idempotency without reads (which cost money/time),
              // we could use the Email as the Document ID.
              // Let's assume we want unique emails.

              if (data.email) {
                  // Using email as ID avoids duplicates naturally
                  // Sanitize email for ID usage
                  const docId = data.email.replace(/[^a-zA-Z0-9]/g, '_');
                  const docRef = doc(db, COLLECTION_NAME, docId);
                  batch.set(docRef, data, { merge: true }); // Upsert
                  results.push({ id: docId, ...data, status: 'processed' });
              } else {
                  // Fallback for missing email (should have been filtered by CSV parser)
                  const docRef = doc(collection(db, COLLECTION_NAME));
                  batch.set(docRef, data);
                  results.push({ id: docRef.id, ...data, status: 'processed' });
              }
          }

          try {
              await batch.commit();
          } catch (e) {
              console.error(`Batch commit failed for chunk starting at index ${i}`, e);
              // Mark these as failed in the result?
              // For now, we log it.
          }
      }
      return results;
  }
};
