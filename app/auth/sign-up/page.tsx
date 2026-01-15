"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSignUp } from "@clerk/nextjs";
import ShareUI from "@/components/auth/shareui";

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;

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
      
      // After animation completes, change to verification form and animate content in
      setTimeout(() => {
        setPendingVerification(true);
        setSuccess("Verification code sent to your email!");
        setResendCooldown(30); // 30 second cooldown before allowing resend
        
        // Reset animation state after content animates in
        setTimeout(() => {
          setIsAnimatingToVerification(false);
        }, 500);
      }, 500); // Wait for sign-up form to animate out
    } catch (err: any) {
      const clerkError = err.errors?.[0] || err;
      const longMessage = clerkError.longMessage || "";
      const shortMessage = clerkError.shortMessage || "";
      
      // Show longMessage if available, otherwise show shortMessage
      const errorMessage = longMessage || shortMessage || "An error occurred during sign up";
      setError(errorMessage);
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
    } catch (err: any) {
      const clerkError = err.errors?.[0] || err;
      const longMessage = clerkError.longMessage || "";
      const shortMessage = clerkError.shortMessage || "";
      
      // Show longMessage if available, otherwise show shortMessage
      const errorMessage = longMessage || shortMessage || "Invalid verification code";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShareUI darkSide="right" isExpanding={isAnimating} shouldAnimateIn={shouldAnimateIn}>
      {/* Clerk CAPTCHA element for bot protection */}
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
                  } catch (err: any) {
                    // Check for rate limit error (429)
                    if (err.status === 429 || err.errors?.[0]?.code === "rate_limit_exceeded") {
                      // Try to get Retry-After from headers or use default
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
          // Sign Up Form
          <form 
            onSubmit={handleSignUp} 
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
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
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
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
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