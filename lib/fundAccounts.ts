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
import { FundAccount } from "@/types/trade";

// Helper to ensure db is initialized
const ensureDb = () => {
  if (!db) {
    throw new Error("Firebase Firestore is not initialized. Please check your Firebase configuration.");
  }
  return db;
};

export const createFundAccount = async (fundAccount: Omit<FundAccount, "id">): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(ensureDb(), "fundAccounts"), {
      ...fundAccount,
      balance: fundAccount.balance ?? fundAccount.initialBalance,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating fund account:", error);
    throw error;
  }
};

export const getFundAccounts = async (userId: string): Promise<FundAccount[]> => {
  try {
    const q = query(
      collection(ensureDb(), "fundAccounts"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const accounts = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        balance: data.balance ?? 0,
        initialBalance: data.initialBalance ?? data.balance ?? 0,
        createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
      } as FundAccount;
    });
    // Sort by createdAt descending in memory to avoid needing composite index
    return accounts.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
  } catch (error) {
    console.error("Error fetching fund accounts:", error);
    throw error;
  }
};

export const getFundAccountById = async (id: string): Promise<FundAccount | null> => {
  try {
    const docRef = doc(ensureDb(), "fundAccounts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        balance: data.balance ?? 0,
        initialBalance: data.initialBalance ?? data.balance ?? 0,
        createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
      } as FundAccount;
    }
    return null;
  } catch (error) {
    console.error("Error fetching fund account:", error);
    throw error;
  }
};

export const updateFundAccount = async (
  id: string,
  updates: Partial<FundAccount>
): Promise<void> => {
  try {
    const docRef = doc(ensureDb(), "fundAccounts", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating fund account:", error);
    throw error;
  }
};

export const updateFundAccountBalance = async (
  id: string,
  pnl: number
): Promise<void> => {
  try {
    const account = await getFundAccountById(id);
    if (!account) {
      throw new Error("Fund account not found");
    }
    const newBalance = account.balance + pnl;
    await updateFundAccount(id, { balance: Math.max(0, newBalance) });
  } catch (error) {
    console.error("Error updating fund account balance:", error);
    throw error;
  }
};

export const deleteFundAccount = async (id: string): Promise<void> => {
  try {
    const docRef = doc(ensureDb(), "fundAccounts", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting fund account:", error);
    throw error;
  }
};

