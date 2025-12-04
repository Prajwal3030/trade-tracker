import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin (server-side only)
let adminApp: App | undefined;
let adminDb: ReturnType<typeof getFirestore> | undefined;

if (typeof window === "undefined") {
  try {
    if (!getApps().length) {
      // Initialize with service account or use default credentials
      // For local development, you can use Application Default Credentials
      // For production, set GOOGLE_APPLICATION_CREDENTIALS environment variable
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      adminApp = getApps()[0];
    }
    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    // Get all user credentials
    const userCredentialsRef = adminDb.collection("userCredentials");
    const snapshot = await userCredentialsRef.get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "No user credentials found",
      });
    }

    // Delete all documents in batch
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      deletedCount: snapshot.size,
      message: `Successfully deleted ${snapshot.size} user credentials`,
    });
  } catch (error: any) {
    console.error("Error deleting user credentials:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user credentials" },
      { status: 500 }
    );
  }
}

