import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { signInWithEmailAndPassword, linkWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import type { User } from "firebase/auth";

export interface UserCredentials {
  userId: string;
  username: string;
  email: string;
  hasPassword: boolean;
  createdAt: Date;
}

// Check if user has username/password set up
export const hasUsernamePassword = async (userId: string): Promise<boolean> => {
  try {
    if (!db) return false;
    const userDoc = await getDoc(doc(db, "userCredentials", userId));
    return userDoc.exists() && userDoc.data()?.hasPassword === true;
  } catch (error) {
    console.error("Error checking username/password:", error);
    return false;
  }
};

// Get user credentials
export const getUserCredentials = async (userId: string): Promise<UserCredentials | null> => {
  try {
    if (!db) return null;
    const userDoc = await getDoc(doc(db, "userCredentials", userId));
    if (!userDoc.exists()) return null;
    const data = userDoc.data();
    return {
      userId: data.userId,
      username: data.username,
      email: data.email,
      hasPassword: data.hasPassword || false,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error getting user credentials:", error);
    return null;
  }
};

// Check if username is available (simple check - just see if it exists for a different user)
export const isUsernameAvailable = async (username: string, currentUserId?: string): Promise<boolean> => {
  try {
    if (!db) {
      console.error("Firestore not initialized");
      return false;
    }
    
    const normalizedUsername = username.toLowerCase().trim();
    if (!normalizedUsername || normalizedUsername.length < 3) {
      return false;
    }
    
    // Simple query: check if username exists
    const q = query(collection(db, "userCredentials"), where("username", "==", normalizedUsername));
    const querySnapshot = await getDocs(q);
    
    // If no documents found, username is available
    if (querySnapshot.empty) {
      return true;
    }
    
    // If username exists, check if it belongs to the current user
    if (currentUserId) {
      const belongsToCurrentUser = querySnapshot.docs.some(doc => {
        const data = doc.data();
        return data.userId === currentUserId;
      });
      
      // If it belongs to current user, it's available (they can keep their own username)
      if (belongsToCurrentUser) {
        return true;
      }
    }
    
    // Username exists and belongs to someone else
    return false;
  } catch (error: any) {
    console.error("Error checking username availability:", error);
    return false;
  }
};

// Setup username and password for Google-authenticated user
export const setupUsernamePassword = async (
  user: User,
  username: string,
  password: string
): Promise<void> => {
  try {
    if (!db || !auth) throw new Error("Firebase not initialized");
    
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || normalizedUsername.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }

    // Simple check: is username available (not taken by another user)?
    const available = await isUsernameAvailable(normalizedUsername, user.uid);
    if (!available) {
      throw new Error("Username is already taken");
    }

    const email = user.email;
    if (!email) {
      throw new Error("User email is required");
    }

    // Try to link email/password credential to Google account
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(user, credential);
    } catch (linkError: any) {
      // If email already exists as separate account, we can't link
      // In this case, we'll just store the username and let them use Google login
      if (linkError.code === "auth/email-already-in-use") {
        console.warn("Email already in use, storing username only");
      } else if (linkError.code === "auth/credential-already-in-use") {
        console.log("Credential already linked");
      } else {
        console.warn("Could not link credential:", linkError);
      }
    }

    // Store username, email, and password indicator in Firestore
    // Structure: { userId, username, email, hasPassword, createdAt }
    const userData = {
      userId: user.uid,
      username: normalizedUsername,
      email: email,
      hasPassword: true,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "userCredentials", user.uid), userData);
  } catch (error: any) {
    console.error("Error setting up username/password:", error);
    throw error;
  }
};

// Login with username and password
export const loginWithUsernamePassword = async (
  username: string,
  password: string
): Promise<User> => {
  try {
    if (!db || !auth) throw new Error("Firebase not initialized");
    
    // Find user by username
    const q = query(collection(db, "userCredentials"), where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("Invalid username or password");
    }

    const userData = querySnapshot.docs[0].data();
    const email = userData.email;

    if (!email) {
      throw new Error("User email not found");
    }

    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error logging in with username/password:", error);
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      throw new Error("Invalid username or password");
    }
    throw error;
  }
};

// Get all registered users (admin function)
export const getAllRegisteredUsers = async (): Promise<UserCredentials[]> => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    
    const querySnapshot = await getDocs(collection(db, "userCredentials"));
    const users: UserCredentials[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        userId: data.userId,
        username: data.username,
        email: data.email,
        hasPassword: data.hasPassword || false,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    
    return users.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

// Delete all user credentials (admin function - use with caution!)
export const deleteAllUserCredentials = async (): Promise<number> => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    
    const querySnapshot = await getDocs(collection(db, "userCredentials"));
    const deletePromises: Promise<void>[] = [];
    
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error deleting all user credentials:", error);
    throw error;
  }
};

