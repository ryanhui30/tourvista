import { Link, redirect } from "react-router";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { loginWithGoogle } from "~/appwrite/auth";
import { account } from "~/appwrite/client";
import { useState } from "react";
import { useNavigate } from "react-router";

export async function loader() {
  try {
    const user = await account.get();
    if (user?.$id) return redirect("/dashboard");
    return null;
  } catch {
    return null;
  }
}

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <section className="size-full glassmorphism flex-center px-6">
        <div className="sign-in-card">
          <header className="header">
            <Link to="/">
              <img
                src="/assets/icons/logo.svg"
                alt="logo"
                className="size-[30px]"
              />
            </Link>
            <h1 className="p-28-bold text-dark-100">Tourvisto</h1>
          </header>

          <article>
            <h2 className="p-28-semibold text-dark-100 text-center">
              Start Your Travel Journey
            </h2>
            <p className="p-18-regular text-center text-gray-100 !leading-7">
              Sign in with Google to manage destinations, itineraries, and user activity with ease.
            </p>
          </article>

          {error && (
            <p className="text-red-500 text-center mb-4">{error}</p>
          )}

          <ButtonComponent
            type="button"
            iconCss="e-search-icon"
            className="button-class !h-11 !w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <img
                  src="/assets/icons/google.svg"
                  className="size-5"
                  alt="google"
                />
                <span className="p-18-semibold text-white">
                  Sign in with Google
                </span>
              </>
            )}
          </ButtonComponent>
        </div>
      </section>
    </main>
  );
};

export default SignIn;
