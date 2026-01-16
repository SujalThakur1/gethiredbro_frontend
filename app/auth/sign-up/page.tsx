"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { ClerkAPIError } from "@clerk/types";
import ShareUI from "@/components/auth/shareui";
import { isSafari, removeCaptchaForSafari } from "@/lib/safari-captcha-handler";

export default function SignUp() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isAnimating, setIsAnimating] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isAnimatingToVerification, setIsAnimatingToVerification] = useState(false);
  
  // Initialize based on sessionStorage to start off-screen if needed
  const [shouldAnimateIn, setShouldAnimateIn] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("navigatingFromSignIn") === "true";
    }
    return false;
  });

  useEffect(() => {
    // Check if we navigated here from a button click
    if (shouldAnimateIn) {
      // Clear the flag
      sessionStorage.removeItem("navigatingFromSignIn");
      // Wait a bit to ensure initial state is rendered, then animate in
      setTimeout(() => {
        setShouldAnimateIn(false);
      }, 50);
    }
    
    // Remove CAPTCHA for Safari users
    removeCaptchaForSafari();
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

  const handleSignInClick = () => {
    setIsAnimating(true);
    // Set flag before navigation
    sessionStorage.setItem("navigatingFromSignUp", "true");
    setTimeout(() => {
      router.push("/auth/sign-in");
    }, 500);
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await signUp.authenticateWithRedirect({
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
          setError(firstError?.longMessage || firstError?.message || "Failed to sign up with Google");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Non-Clerk error:", err);
      }
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    // Safari fix: Manual validation since we're using noValidate
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create the sign-up attempt - this will trigger email verification
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Send the email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Start animation: animate sign-up form out to the right
      setIsAnimatingToVerification(true);
      
      // Safari fix: Set verification state immediately to prevent button freeze
      // This removes the nested setTimeout pattern that Safari blocks
      setPendingVerification(true);
      setSuccess("Verification code sent to your email!");
      setResendCooldown(30); // 30 second cooldown before allowing resend
      
      // Reset animation state after content animates in (non-blocking, single setTimeout)
      setTimeout(() => {
        setIsAnimatingToVerification(false);
      }, 1000); // Combined timing for both animations
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const firstError = err.errors[0];
        // Handle special error cases
        if (firstError?.code === "user_locked") {
          const lockoutTime = firstError.meta?.lockout_expires_in_seconds || 1800;
          setError(`Account locked. You will be able to try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
        } else {
          setError(firstError?.longMessage || firstError?.message || "An error occurred during sign up");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Non-Clerk error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      // Verify the code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        // Redirect to home after successful verification
        router.push("/home");
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
    <ShareUI darkSide="right" isExpanding={isAnimating} shouldAnimateIn={shouldAnimateIn}>
      {/* Clerk CAPTCHA element for bot protection - Hidden for Safari */}
      {/* {!isSafari() && <div id="clerk-captcha" className="hidden"></div>} */}
       <div id="clerk-captcha" className="hidden"></div>
      
      <div className={`w-full max-w-md space-y-6 transition-all duration-500 ease-in-out ${
        isAnimating
          ? "translate-x-full opacity-0 scale-95"
          : shouldAnimateIn
          ? "translate-x-full opacity-0 scale-95"
          : "translate-x-0 opacity-100 scale-100"
      }`}>
        <div className={`transition-all duration-500 ease-in-out ${
          isAnimating
            ? "translate-x-full opacity-0 scale-95"
            : shouldAnimateIn
            ? "translate-x-full opacity-0 scale-95"
            : isAnimatingToVerification && !pendingVerification
            ? "translate-x-full opacity-0 scale-95"
            : isAnimatingToVerification && pendingVerification
            ? "translate-x-full opacity-0 scale-95"
            : "translate-x-0 opacity-100 scale-100"
        }`}>
          <h2 className="text-3xl font-bold text-white mb-2">Sign Up</h2>
          <p className="text-gray-300">Create your account to get started.</p>
        </div>

        {error && (
          <div className={`p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-sm transition-all duration-500 ease-in-out ${
            isAnimating
              ? "translate-x-full opacity-0 scale-95"
              : shouldAnimateIn
              ? "translate-x-full opacity-0 scale-95"
              : isAnimatingToVerification && !pendingVerification
              ? "translate-x-full opacity-0 scale-95"
              : isAnimatingToVerification && pendingVerification
              ? "translate-x-full opacity-0 scale-95"
              : "translate-x-0 opacity-100 scale-100"
          }`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`p-3 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg text-green-200 text-sm transition-all duration-500 ease-in-out ${
            isAnimating
              ? "translate-x-full opacity-0 scale-95"
              : shouldAnimateIn
              ? "translate-x-full opacity-0 scale-95"
              : isAnimatingToVerification && !pendingVerification
              ? "translate-x-full opacity-0 scale-95"
              : isAnimatingToVerification && pendingVerification
              ? "translate-x-full opacity-0 scale-95"
              : "translate-x-0 opacity-100 scale-100"
          }`}>
            {success}
          </div>
        )}

        {pendingVerification ? (
          // OTP Verification Form
          <form 
            onSubmit={handleVerifyEmail} 
            className={`space-y-4 transition-all duration-500 ease-in-out ${
              isAnimating
                ? "translate-x-full opacity-0 scale-95"
                : shouldAnimateIn
                ? "translate-x-full opacity-0 scale-95"
                : isAnimatingToVerification
                ? "translate-x-full opacity-0 scale-95"
                : "translate-x-0 opacity-100 scale-100"
            }`}
          >
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Verify Your Email</h3>
              <p className="text-gray-300 text-sm mb-4">
                We sent a verification code to <span className="font-semibold">{email}</span>
              </p>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-white mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!isLoaded || !signUp || resendCooldown > 0) return;
                  
                  setIsLoading(true);
                  setError(null);
                  
                  try {
                    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                    setSuccess("New verification code sent!");
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
          // Sign Up Form
          <form 
            onSubmit={handleSignUp}
            noValidate
            className={`space-y-4 transition-all duration-500 ease-in-out ${
              isAnimating
                ? "translate-x-full opacity-0 scale-95"
                : shouldAnimateIn
                ? "translate-x-full opacity-0 scale-95"
                : isAnimatingToVerification
                ? "translate-x-full opacity-0 scale-95"
                : "translate-x-0 opacity-100 scale-100"
            }`}
          >
          {/* First Name and Last Name in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="First name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Create a password"
            />
          </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
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
              onClick={handleGoogleSignUp}
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
              Sign up with Google
            </button>
          </form>
        )}

        {!pendingVerification && (
          <div className={`text-center transition-all duration-500 ease-in-out ${
            isAnimating
              ? "translate-x-full opacity-0 scale-95"
              : shouldAnimateIn
              ? "translate-x-full opacity-0 scale-95"
              : isAnimatingToVerification
              ? "translate-x-full opacity-0 scale-95"
              : "translate-x-0 opacity-100 scale-100"
          }`}>
            <p className="text-gray-300 text-sm">
              Already have an account?{" "}
              <button
                onClick={handleSignInClick}
                className="text-blue-400 hover:text-blue-300 font-semibold underline"
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </ShareUI>
  );
}