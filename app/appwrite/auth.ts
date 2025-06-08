import { ID, OAuthProvider, Query } from "appwrite";
import { account, database, appwriteConfig } from "~/appwrite/client";
import { redirect } from "react-router";

// Type definitions for better type safety
interface AppwriteUser {
  $id: string;
  email: string;
  name: string;
}

interface DatabaseUser extends AppwriteUser {
  imageUrl?: string;
  joinedAt: string;
}

export const getExistingUser = async (id: string): Promise<DatabaseUser | null> => {
  try {
    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", id)]
    );
    return documents[0] as DatabaseUser || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to check user existence");
  }
};


export const storeUserData = async (): Promise<DatabaseUser> => {
  try {
    const user = await account.get() as AppwriteUser;
    if (!user?.$id) throw new Error("No authenticated user");

    const session = await account.getSession("current");
    const profilePicture = session?.providerAccessToken
      ? await getGoogleProfilePicture(session.providerAccessToken)
      : undefined;

    return await database.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: user.$id,
        email: user.email,
        name: user.name,
        imageUrl: profilePicture,
        joinedAt: new Date().toISOString(),
      }
    ) as DatabaseUser;
  } catch (error) {
    console.error("Error storing user data:", error);
    throw new Error("Failed to create user profile");
  }
};

const getGoogleProfilePicture = async (accessToken: string): Promise<string | undefined> => {
  try {
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=photos",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) throw new Error("Failed to fetch Google profile");
    const { photos } = await response.json();
    return photos?.[0]?.url;
  } catch (error) {
    console.error("Error fetching Google picture:", error);
    return undefined;
  }
};

export const loginWithGoogle = async (): Promise<void> => {
  try {
    await account.createOAuth2Session(
      OAuthProvider.Google,
      `${window.location.origin}/dashboard`,  // Success URL
      `${window.location.origin}/sign-in`,    // Failure URL
      ['email', 'profile', 'openid']         // Required OAuth scopes
    );
  } catch (error) {
    console.error("Google login failed:", error);
    throw new Error("Google authentication failed. Please try again.");
  }
};


export const logoutUser = async (): Promise<void> => {
  try {
    await account.deleteSession("current");
    // Hard redirect to clear all state
    window.location.href = "/sign-in";
  } catch (error) {
    console.error("Logout failed:", error);
    throw new Error("Failed to log out. Please try again.");
  }
};

export const verifySession = async (): Promise<DatabaseUser | null> => {
  try {
    // Check active session exists
    const session = await account.getSession("current");
    if (!session?.$id) return null;

    // Get account details
    const user = await account.get() as AppwriteUser;
    if (!user?.$id) return null;

    // Ensure user exists in database
    let dbUser = await getExistingUser(user.$id);
    if (!dbUser) {
      dbUser = await storeUserData();
    }

    return dbUser;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
};

export const getUser = async (): Promise<DatabaseUser | Response> => {
  try {
    const user = await verifySession();
    return user || redirect("/sign-in");
  } catch (error) {
    console.error("Failed to get user:", error);
    return redirect("/sign-in");
  }
};

export const getAllUsers = async (
  limit: number,
  offset: number
): Promise<{ users: DatabaseUser[]; total: number }> => {
  try {
    const { documents, total } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc("joinedAt")
      ]
    );
    return { users: documents as DatabaseUser[], total };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { users: [], total: 0 };
  }
};
