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
  const [rememberMe, setRememberMe] = useState(false);
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [secondFactorCode, setSecondFactorCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Initialize based on sessionStorage to start off-screen if needed
  const [shouldAnimateIn, setShouldAnimateIn] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("navigatingFromSignUp") === "true" || 
             sessionStorage.getItem("navigatingFromForgotPassword") === "true";
    }
    return false;
  });

  // Load saved email from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmailData = localStorage.getItem("rememberMeEmail");
      if (savedEmailData) {
        try {
          const { email: savedEmail, expiresAt } = JSON.parse(savedEmailData);
          // Check if the saved email is still valid (within 7 days)
          if (expiresAt && Date.now() < expiresAt) {
            setEmail(savedEmail);
            setRememberMe(true);
          } else {
            // Expired, remove it
            localStorage.removeItem("rememberMeEmail");
          }
        } catch (error) {
          // Invalid data, remove it
          localStorage.removeItem("rememberMeEmail");
        }
      }
    }
  }, []);

  useEffect(() => {
    // Check if we navigated here from a button click
    if (shouldAnimateIn) {
      // Clear the flags
      sessionStorage.removeItem("navigatingFromSignUp");
      sessionStorage.removeItem("navigatingFromForgotPassword");
      // Wait a bit to ensure initial state is rendered, then animate in
      setTimeout(() => {
        setShouldAnimateIn(false);
      }, 50);
    }
  }, [shouldAnimateIn]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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
    
    if (!isLoaded) {
      setError("Clerk is not loaded yet. Please wait...");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Attempt to sign in
      const result = await signIn.create({
        identifier: email,
        password,
      });

      // Handle different sign-in statuses
      if (result.status === "complete") {
        // Handle "Remember Me" functionality
        if (rememberMe && email) {
          // Save email with 7-day expiration timestamp
          const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          const emailData = {
            email: email,
            expiresAt: expiresAt,
          };
          localStorage.setItem("rememberMeEmail", JSON.stringify(emailData));
        } else {
          // If not checked, remove any saved email
          localStorage.removeItem("rememberMeEmail");
        }

        // Set the active session
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          // Use window.location for more reliable redirect
          window.location.href = "/home";
        } else {
          setError("Session creation failed. Please try again.");
        }
      } else if (result.status === "needs_first_factor") {
        setError("Two-factor authentication is required. Please complete the verification.");
      } else if (result.status === "needs_second_factor") {
        // Prepare second factor verification (send OTP)
        try {
          await signIn.prepareSecondFactor({ strategy: "email_code" });
          setNeedsSecondFactor(true);
          setResendCooldown(30); // 30 second cooldown
        } catch (err: any) {
          const clerkError = err.errors?.[0] || err;
          const longMessage = clerkError.longMessage || "";
          const shortMessage = clerkError.shortMessage || "";
          setError(longMessage || shortMessage || "Failed to send verification code");
        }
      } else {
        setError(`Sign-in status: ${result.status}. Please try again.`);
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

  const handleVerifySecondFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    setError(null);

    try {
      // Attempt to verify the second factor
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: secondFactorCode,
      });

      if (result.status === "complete") {
        // Handle "Remember Me" functionality
        if (rememberMe && email) {
          const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
          const emailData = {
            email: email,
            expiresAt: expiresAt,
          };
          localStorage.setItem("rememberMeEmail", JSON.stringify(emailData));
        } else {
          localStorage.removeItem("rememberMeEmail");
        }

        // Set the active session
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          window.location.href = "/home";
        } else {
          setError("Session creation failed. Please try again.");
        }
      }
    } catch (err: any) {
      const clerkError = err.errors?.[0] || err;
      const longMessage = clerkError.longMessage || "";
      const shortMessage = clerkError.shortMessage || "";
      
      const errorMessage = longMessage || shortMessage || "Invalid verification code";
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

        {needsSecondFactor ? (
          // Second Factor OTP Verification Form
          <form onSubmit={handleVerifySecondFactor} className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Verify Your Email</h3>
              <p className="text-gray-300 text-sm mb-4">
                We sent a verification code to <span className="font-semibold">{email}</span>
              </p>
            </div>

            <div>
              <label htmlFor="secondFactorCode" className="block text-sm font-medium text-white mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="secondFactorCode"
                value={secondFactorCode}
                onChange={(e) => setSecondFactorCode(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify & Sign In"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!isLoaded || !signIn || resendCooldown > 0) return;
                  
                  setIsLoading(true);
                  setError(null);
                  
                  try {
                    await signIn.prepareSecondFactor({ strategy: "email_code" });
                    setError(null);
                    setResendCooldown(30); // 30 second cooldown
                  } catch (err: any) {
                    // Check for rate limit error (429)
                    if (err.status === 429 || err.errors?.[0]?.code === "rate_limit_exceeded") {
                      const retryAfter = err.headers?.['retry-after'] || err.retryAfter || 10;
                      const waitTime = parseInt(retryAfter.toString());
                      setError(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
                      setResendCooldown(waitTime);
                    } else {
                      const clerkError = err.errors?.[0] || err;
                      const longMessage = clerkError.longMessage || "";
                      const shortMessage = clerkError.shortMessage || "";
                      const errorMessage = longMessage || shortMessage || "Failed to resend code";
                      setError(errorMessage);
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={resendCooldown > 0 || isLoading}
                className="text-blue-400 hover:text-blue-300 text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        ) : (
          // Regular Sign In Form
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
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white bg-opacity-10 border-white border-opacity-20 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-300">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsAnimating(true);
                sessionStorage.setItem("navigatingFromSignIn", "true");
                setTimeout(() => {
                  router.push("/auth/forget-password");
                }, 500);
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        )}

        {!needsSecondFactor && (
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
        )}
      </div>
    </ShareUI>
  );
}

