"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { ClerkAPIError } from "@clerk/types";
import ShareUI from "@/components/auth/shareui";
import { isSafari, removeCaptchaForSafari } from "@/lib/safari-captcha-handler";

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
      
      // Remove CAPTCHA for Safari users
      removeCaptchaForSafari();
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

  // Check if we came from SSO callback (redirected here instead of home)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const fromSSO = searchParams.get("fromSSO");
      const fromSSOCallback = sessionStorage.getItem("fromSSOCallback");
      
      // Only show error if both the query parameter AND sessionStorage flag are present
      // This prevents showing error for manual URL navigation
      if (fromSSO === "true" && fromSSOCallback === "true") {
        setError("Something went wrong during authentication. Please try again.");
        
        // Clear the sessionStorage flag
        sessionStorage.removeItem("fromSSOCallback");
        
        // Clean up URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  const handleSignUpClick = () => {
    setIsAnimating(true);
    // Set flag before navigation
    sessionStorage.setItem("navigatingFromSignIn", "true");
    setTimeout(() => {
      router.push("/auth/sign-up");
    }, 500);
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Use signIn.authenticateWithRedirect - it will sign in existing users
      // and can create new users if configured in Clerk dashboard
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/home",
      });
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const firstError = err.errors[0];
        // Handle special error cases
        if (firstError?.code === "user_locked") {
          const lockoutTime = firstError.meta?.lockout_expires_in_seconds || 1800;
          setError(`Account locked. You will be able to try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
        } else {
          setError(firstError?.longMessage || firstError?.message || "Failed to sign in with Google");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Non-Clerk error:", err);
      }
      setIsLoading(false);
    }
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
        } catch (err) {
          if (isClerkAPIResponseError(err)) {
            const firstError = err.errors[0];
            setError(firstError?.longMessage || firstError?.message || "Failed to send verification code");
          } else {
            setError("An unexpected error occurred. Please try again.");
            console.error("Non-Clerk error:", err);
          }
        }
      } else {
        setError(`Sign-in status: ${result.status}. Please try again.`);
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const firstError = err.errors[0];
        // Handle special error cases
        if (firstError?.code === "user_locked") {
          const lockoutTime = firstError.meta?.lockout_expires_in_seconds || 1800;
          setError(`Account locked. You will be able to try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
        } else if (firstError?.code === "form_password_compromised") {
          setError("Your password appears to have been compromised. Please use email code to sign in or reset your password.");
        } else {
          setError(firstError?.longMessage || firstError?.message || "An error occurred during sign in");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Non-Clerk error:", err);
      }
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
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const firstError = err.errors[0];
        setError(firstError?.longMessage || firstError?.message || "Invalid verification code");
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Non-Clerk error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShareUI isExpanding={isAnimating} shouldAnimateIn={shouldAnimateIn}>
      {/* Clerk CAPTCHA element for bot protection - Hidden for Safari */}
      {/* {!isSafari() && <div id="clerk-captcha" className="hidden"></div>} */}
       <div id="clerk-captcha" className="hidden"></div>
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
                  } catch (err) {
                    if (isClerkAPIResponseError(err)) {
                      const firstError = err.errors[0];
                      // Check for rate limit error
                      if (firstError?.code === "rate_limit_exceeded") {
                        const retryAfter = firstError.meta?.retry_after_seconds || 10;
                        const waitTime = parseInt(retryAfter.toString());
                        setError(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
                        setResendCooldown(waitTime);
                      } else {
                        setError(firstError?.longMessage || firstError?.message || "Failed to resend code");
                      }
                    } else {
                      // Check for HTTP 429 status
                      if ((err as any)?.status === 429) {
                        const retryAfter = (err as any)?.headers?.['retry-after'] || (err as any)?.retryAfter || 10;
                        const waitTime = parseInt(retryAfter.toString());
                        setError(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
                        setResendCooldown(waitTime);
                      } else {
                        setError("An unexpected error occurred. Please try again.");
                        console.error("Non-Clerk error:", err);
                      }
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white border-opacity-20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-300">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
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

