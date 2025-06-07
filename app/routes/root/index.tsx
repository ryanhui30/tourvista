import { redirect } from "react-router";
import { account } from "~/appwrite/client";

export async function loader() {
  try {
    const user = await account.get();
    return user?.$id ? redirect("/dashboard") : redirect("/sign-in");
  } catch {
    return redirect("/sign-in");
  }
}

export default function IndexRoute() {
  return null;
}
