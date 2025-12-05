import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { Strategy, ChecklistItem } from "@/types/trade";

// Helper to ensure db is initialized
const ensureDb = () => {
  if (!db) {
    throw new Error("Firebase Firestore is not initialized. Please check your Firebase configuration.");
  }
  return db;
};

export const saveStrategy = async (strategy: Omit<Strategy, "id">): Promise<string> => {
  try {
    const strategyData = {
      ...strategy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(ensureDb(), "strategies"), strategyData);
    return docRef.id;
  } catch (error) {
    console.error("Error saving strategy:", error);
    throw error;
  }
};

export const getStrategies = async (userId: string): Promise<Strategy[]> => {
  try {
    const q = query(
      collection(ensureDb(), "strategies"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    const strategies = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate() || new Date(data.updatedAt),
      } as Strategy;
    });
    
    // Sort by name client-side to avoid needing a composite index
    return strategies.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching strategies:", error);
    throw error;
  }
};

export const getStrategyById = async (id: string, userId: string): Promise<Strategy | null> => {
  try {
    const ref = doc(ensureDb(), "strategies", id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    
    // Verify ownership
    if (data.userId !== userId) {
      throw new Error("Unauthorized access to strategy");
    }

    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate() || new Date(data.updatedAt),
    } as Strategy;
  } catch (error) {
    console.error("Error fetching strategy by id:", error);
    throw error;
  }
};

export const updateStrategy = async (
  id: string,
  strategy: Partial<Strategy>,
  userId: string
): Promise<void> => {
  try {
    // Verify ownership first
    const existing = await getStrategyById(id, userId);
    if (!existing) {
      throw new Error("Strategy not found or unauthorized");
    }

    const strategyData = {
      ...strategy,
      updatedAt: Timestamp.now(),
    };

    const ref = doc(ensureDb(), "strategies", id);
    await updateDoc(ref, strategyData);
  } catch (error) {
    console.error("Error updating strategy:", error);
    throw error;
  }
};

export const deleteStrategy = async (id: string, userId: string): Promise<void> => {
  try {
    // Verify ownership first
    const existing = await getStrategyById(id, userId);
    if (!existing) {
      throw new Error("Strategy not found or unauthorized");
    }

    const ref = doc(ensureDb(), "strategies", id);
    await deleteDoc(ref);
  } catch (error) {
    console.error("Error deleting strategy:", error);
    throw error;
  }
};

