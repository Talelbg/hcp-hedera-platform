import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Community } from '../types';

const COLLECTION_NAME = 'communities';

export interface BulkImportResult {
  imported: number;
  updated: number;
  errors: { slug: string; reason: string }[];
}

export const communityService = {
  /**
   * Get all communities
   */
  getCommunities: async (): Promise<Community[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const results: Community[] = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as Community);
      });
      return results;
    } catch (error) {
      console.error('Error getting communities:', error);
      throw error;
    }
  },

  /**
   * Get a community by slug
   */
  getCommunityBySlug: async (slug: string): Promise<Community | null> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Community;
    } catch (error) {
      console.error('Error getting community by slug:', error);
      throw error;
    }
  },

  /**
   * Get a community by ID
   */
  getCommunityById: async (id: string): Promise<Community | null> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return null;
      }
      return { id: docSnap.id, ...docSnap.data() } as Community;
    } catch (error) {
      console.error('Error getting community by ID:', error);
      throw error;
    }
  },

  /**
   * Bulk import communities with upsert behavior.
   * Uses slug as the unique key to prevent duplicates.
   * Updates existing communities if they already exist.
   */
  bulkImportCommunities: async (
    communities: Omit<Community, 'id'>[]
  ): Promise<BulkImportResult> => {
    const result: BulkImportResult = {
      imported: 0,
      updated: 0,
      errors: []
    };

    if (communities.length === 0) {
      return result;
    }

    const batchSize = 500; // Firestore batch limit
    const now = new Date().toISOString();

    // First, fetch all existing slugs to determine upsert behavior
    const existingSlugs = new Map<string, string>(); // slug -> docId
    try {
      const existingDocs = await getDocs(collection(db, COLLECTION_NAME));
      existingDocs.forEach((doc) => {
        const data = doc.data();
        if (data.slug) {
          existingSlugs.set(data.slug, doc.id);
        }
      });
    } catch (error) {
      console.error('Error fetching existing communities:', error);
      // Continue with import - will create new docs
    }

    // Process in batches
    for (let i = 0; i < communities.length; i += batchSize) {
      const chunk = communities.slice(i, i + batchSize);
      const batch = writeBatch(db);

      // Track counts for this specific chunk
      let chunkImported = 0;
      let chunkUpdated = 0;

      for (const community of chunk) {
        try {
          const existingDocId = existingSlugs.get(community.slug);
          
          if (existingDocId) {
            // Update existing document
            const docRef = doc(db, COLLECTION_NAME, existingDocId);
            batch.update(docRef, {
              displayName: community.displayName,
              metadata: community.metadata || null,
              updatedAt: now
            });
            chunkUpdated++;
          } else {
            // Create new document using slug as document ID for easy lookup
            const docRef = doc(db, COLLECTION_NAME, community.slug);
            batch.set(docRef, {
              displayName: community.displayName,
              slug: community.slug,
              metadata: community.metadata || null,
              createdAt: community.createdAt || now,
              updatedAt: now
            });
            chunkImported++;
            // Track this new slug to avoid duplicates within the same import
            existingSlugs.set(community.slug, community.slug);
          }
        } catch (error) {
          result.errors.push({
            slug: community.slug,
            reason: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      try {
        await batch.commit();
        // Only add to result counts after successful commit
        result.imported += chunkImported;
        result.updated += chunkUpdated;
      } catch (error) {
        console.error(`Batch commit failed for chunk starting at index ${i}:`, error);
        // Mark all items in this batch as errors
        for (const community of chunk) {
          result.errors.push({
            slug: community.slug,
            reason: 'Batch commit failed'
          });
        }
        // Don't add chunk counts to result since batch failed
      }
    }

    return result;
  }
};

export default communityService;
