// =============================================================================
// Firestore Batch Operations & Pagination Utilities
// Production-grade batch writing and pagination strategies
// =============================================================================

import {
  collection,
  query,
  limit,
  startAfter,
  getDocs,
  writeBatch,
  doc,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { firestore } from "./firebase";

/**
 * Pagination state for managing large result sets
 */
export interface PaginationState {
  lastDoc: any | null;
  hasMore: boolean;
  pageSize: number;
}

/**
 * Initialize pagination state
 */
export function initializePagination(pageSize: number = 20): PaginationState {
  return {
    lastDoc: null,
    hasMore: true,
    pageSize,
  };
}

/**
 * Fetch first page of results
 */
export async function fetchFirstPage<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[],
  pageSize: number = 20
): Promise<{ docs: (T & { id: string })[]; pagination: PaginationState }> {
  const q = query(
    collection(firestore, collectionPath),
    ...constraints,
    limit(pageSize)
  );

  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as T & { id: string }));

  return {
    docs,
    pagination: {
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length >= pageSize,
      pageSize,
    },
  };
}

/**
 * Fetch next page of results
 */
export async function fetchNextPage<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[],
  pagination: PaginationState
): Promise<{ docs: (T & { id: string })[]; pagination: PaginationState }> {
  if (!pagination.hasMore || !pagination.lastDoc) {
    return { docs: [], pagination };
  }

  const q = query(
    collection(firestore, collectionPath),
    ...constraints,
    startAfter(pagination.lastDoc),
    limit(pagination.pageSize)
  );

  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as T & { id: string }));

  return {
    docs,
    pagination: {
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length >= pagination.pageSize,
      pageSize: pagination.pageSize,
    },
  };
}

/**
 * Batch write documents (handles 500-doc limit)
 * Automatically splits into multiple batches if needed
 */
export async function batchWriteDocs(
  writes: Array<{
    collectionPath: string;
    docId: string;
    data: DocumentData;
    merge?: boolean;
  }>
): Promise<{ success: number; failed: number }> {
  const BATCH_SIZE = 500; // Firestore batch limit
  let success = 0;
  let failed = 0;

  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    const batchWrites = writes.slice(i, i + BATCH_SIZE);

    try {
      for (const write of batchWrites) {
        const docRef = doc(firestore, write.collectionPath, write.docId);
        if (write.merge) {
          batch.update(docRef, write.data);
        } else {
          batch.set(docRef, write.data);
        }
      }

      await batch.commit();
      success += batchWrites.length;
    } catch (error) {
      console.error(`Batch write failed for items ${i}-${i + batchWrites.length}:`, error);
      failed += batchWrites.length;
    }
  }

  return { success, failed };
}

/**
 * Batch delete documents
 */
export async function batchDeleteDocs(
  deletes: Array<{
    collectionPath: string;
    docId: string;
  }>
): Promise<{ success: number; failed: number }> {
  const BATCH_SIZE = 500;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < deletes.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    const batchDeletes = deletes.slice(i, i + BATCH_SIZE);

    try {
      for (const del of batchDeletes) {
        const docRef = doc(firestore, del.collectionPath, del.docId);
        batch.delete(docRef);
      }

      await batch.commit();
      success += batchDeletes.length;
    } catch (error) {
      console.error(`Batch delete failed for items ${i}-${i + batchDeletes.length}:`, error);
      failed += batchDeletes.length;
    }
  }

  return { success, failed };
}

/**
 * Batch update documents with same data
 */
export async function batchUpdateDocs(
  collectionPath: string,
  docIds: string[],
  updateData: DocumentData
): Promise<{ success: number; failed: number }> {
  const writes = docIds.map((docId) => ({
    collectionPath,
    docId,
    data: updateData,
    merge: true,
  }));

  return batchWriteDocs(writes);
}
