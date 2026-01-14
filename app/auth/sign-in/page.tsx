"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";
import ShareUI from "@/components/auth/shareui";

export default function SignIn() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize based on sessionStorage to start off-screen if needed
  const [shouldAnimateIn, setShouldAnimateIn] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("navigatingFromSignUp") === "true";
    }
    return false;
  });

  useEffect(() => {
    // Check if we navigated here from a button click
    if (shouldAnimateIn) {
      // Clear the flag
      sessionStorage.removeItem("navigatingFromSignUp");
      // Wait a bit to ensure initial state is rendered, then animate in
      setTimeout(() => {
        setShouldAnimateIn(false);
      }, 50);
    }
  }, [shouldAnimateIn]);

  const handleSignUpClick = () => {
    setIsAnimating(true);
    // Set flag before navigation
    sessionStorage.setItem("navigatingFromSignIn", "true");
    setTimeout(() => {
      router.push("/auth/sign-up");
    }, 500);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      // Attempt to sign in
      const result = await signIn.create({
        identifier: email,
        password,
      });

      // If sign-in is complete, set the session and redirect
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/home");
      }
    } catch (err: any) {
      const clerkError = err.errors?.[0] || err;
      const longMessage = clerkError.longMessage || "";
      const shortMessage = clerkError.shortMessage || "";
      
      // Show longMessage if available, otherwise show shortMessage
      const errorMessage = longMessage || shortMessage || "An error occurred during sign in";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShareUI isExpanding={isAnimating} shouldAnimateIn={shouldAnimateIn}>
      <div className={`w-full max-w-md space-y-6 transition-all duration-500 ease-in-out ${
        isAnimating
          ? "-translate-x-full opacity-0 scale-95"
          : shouldAnimateIn
          ? "-translate-x-full opacity-0 scale-95"
          : "translate-x-0 opacity-100 scale-100"
      }`}>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
          <p className="text-gray-300">Welcome back! Please sign in to your account.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-white bg-opacity-10 border-white border-opacity-20 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-300">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-300 text-sm">
            Don't have an account?{" "}
            <button
              onClick={handleSignUpClick}
              className="text-blue-400 hover:text-blue-300 font-semibold underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </ShareUI>
  );
}

