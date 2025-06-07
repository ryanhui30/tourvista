import { ID, OAuthProvider, Query } from "appwrite";
import { account, database, appwriteConfig } from "~/appwrite/client";
import { redirect } from "react-router";

export const getExistingUser = async (id: string) => {
    try {
        const { documents } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", id)]
        );
        return documents[0] || null;
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
};

export const storeUserData = async () => {
    try {
        const user = await account.get();
        if (!user?.$id) throw new Error("No authenticated user");

        const session = await account.getSession("current");
        const profilePicture = session?.providerAccessToken
            ? await getGooglePicture(session.providerAccessToken)
            : null;

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
        );
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

        if (!response.ok) throw new Error("Failed to fetch Google profile");
        const data = await response.json();
        return data.photos?.[0]?.url || null;
    } catch (error) {
        console.error("Error fetching Google picture:", error);
        return null;
    }
};

export const loginWithGoogle = async () => {
    try {
        // Clear existing session first
        await account.deleteSession("current");

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

export const logoutUser = async () => {
    try {
        await account.deleteSession("current");
    } catch (error) {
        console.error("Logout failed:", error);
        throw error;
    }
};

export const verifySession = async () => {
    try {
        const session = await account.getSession("current");
        if (!session) return null;

        const user = await account.get();
        if (!user?.$id) return null;

        // Ensure user exists in database
        const existingUser = await getExistingUser(user.$id);
        if (!existingUser) {
            return await storeUserData();
        }

        return existingUser;
    } catch (error) {
        console.error("Session verification failed:", error);
        return null;
    }
};

export const getUser = async () => {
    try {
        const user = await verifySession();
        return user || redirect("/sign-in");
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
            [
                Query.limit(limit),
                Query.offset(offset),
                Query.orderDesc("joinedAt")
            ]
        );
        return { users, total };
    } catch (error) {
        console.error("Get all users failed:", error);
        return { users: [], total: 0 };
    }
};
