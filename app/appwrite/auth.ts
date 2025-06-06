import { ID, OAuthProvider, Query } from "appwrite";
import { account, database, appwriteConfig } from "~/appwrite/client";
import { redirect } from "react-router";

export const getExistingUser = async (id: string) => {
    try {
        const { documents, total } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", id)]
        );
        return total > 0 ? documents[0] : null;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};

export const storeUserData = async () => {
    try {
        const user = await account.get();
        if (!user) throw new Error("User not found");

        const session = await account.getSession("current");
        const providerAccessToken = session?.providerAccessToken;

        // Get Google picture with retry logic
        let profilePicture = null;
        if (providerAccessToken) {
            try {
                profilePicture = await getGooglePicture(providerAccessToken);
                // If first attempt fails, wait and try again
                if (!profilePicture) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    profilePicture = await getGooglePicture(providerAccessToken);
                }
            } catch (error) {
                console.error("Error getting Google picture:", error);
            }
        }

        const createdUser = await database.createDocument(
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
        );

        return createdUser;
    } catch (error) {
        console.error("Error storing user data:", error);
        throw error;
    }
};

const getGooglePicture = async (accessToken: string) => {
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
        if (!response.ok) throw new Error("Failed to fetch Google profile picture");

        const data = await response.json();
        return data.photos?.[0]?.url || null;
    } catch (error) {
        console.error("Error fetching Google picture:", error);
        return null;
    }
};

export const loginWithGoogle = async () => {
    try {
        // Clear any existing sessions first
        try {
            await account.deleteSession("current");
        } catch {}

        await account.createOAuth2Session(
            OAuthProvider.Google,
            `${window.location.origin}/dashboard`,  // Success URL
            `${window.location.origin}/sign-in`     // Failure URL
        );
    } catch (error) {
        console.error("Google login failed:", error);
        throw error;
    }
};

export const verifySession = async () => {
    try {
        const session = await account.getSession('current');
        if (!session) return null;

        const user = await account.get();
        if (!user) return null;

        // Check if user exists in database, create if not
        const existingUser = await getExistingUser(user.$id);
        if (!existingUser) {
            await storeUserData();
            // Return fresh user data after creation
            return await getExistingUser(user.$id);
        }

        return existingUser;
    } catch (error) {
        console.error("Session verification failed:", error);
        return null;
    }
};

export const logoutUser = async () => {
    try {
        await account.deleteSession("current");
    } catch (error) {
        console.error("Logout failed:", error);
    }
};

export const getUser = async () => {
    try {
        const user = await verifySession(); // Use verifySession instead of direct account.get
        if (!user) return redirect("/sign-in");
        return user;
    } catch (error) {
        console.error("Get user failed:", error);
        return redirect("/sign-in");
    }
};

export const getAllUsers = async (limit: number, offset: number) => {
    try {
        const { documents: users, total } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.limit(limit), Query.offset(offset)]
        );

        if(total === 0) return { users: [], total };

        return { users, total };
    } catch (e) {
        console.error("Get all users failed:", e);
        return { users: [], total: 0 };
    }
};
