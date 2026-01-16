"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { ClerkAPIError } from "@clerk/types";
import ShareUI from "@/components/auth/shareui";
import { isSafari, removeCaptchaForSafari } from "@/lib/safari-captcha-handler";

export default function ForgotPassword() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Code, 3: Password
  const [resendCooldown, setResendCooldown] = useState(0);
  const [darkSide, setDarkSide] = useState<"left" | "right">("right"); // Start with right side dark
  const [isExpandingToLeft, setIsExpandingToLeft] = useState(false);
  const [shouldAnimateToLeft, setShouldAnimateToLeft] = useState(false);
  const [isContentAnimating, setIsContentAnimating] = useState(false);
  const [isAnimatingToStep2, setIsAnimatingToStep2] = useState(false);
  
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
    // removeCaptchaForSafari();
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

  const handleBackToSignIn = () => {
    setIsAnimating(true);
    sessionStorage.setItem("navigatingFromForgotPassword", "true");
    setTimeout(() => {
      router.push("/auth/sign-in");
    }, 500);
  };

  // Step 1: Send reset code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create password reset session (this automatically sends the code)
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      // Start animation: animate step 1 content out to the right
      setIsAnimatingToStep2(true);
      
      // After animation completes, change to step 2 and animate content in
      setTimeout(() => {
        setStep(2);
        setSuccess("Verification code sent to your email!");
        setResendCooldown(30); // 30 second cooldown
        
        // Reset animation state after content animates in
        setTimeout(() => {
          setIsAnimatingToStep2(false);
        }, 500);
      }, 500); // Wait for step 1 content to animate out
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const firstError = err.errors[0];
        // Handle special error cases
        if (firstError?.code === "user_locked") {
          const lockoutTime = firstError.meta?.lockout_expires_in_seconds || 1800;
          setError(`Account locked. You will be able to try again in ${Math.ceil(lockoutTime / 60)} minutes.`);
        } else {
          setError(firstError?.longMessage || firstError?.message || "Failed to send verification code");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Non-Clerk error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code (store code, move to password step)
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;

    // Just validate code format and move to next step
    // Actual verification happens in step 3 with password
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    // Start animation: expand to full dark and animate content out
    setIsExpandingToLeft(true);
    setIsContentAnimating(true);
    
    // After expansion, change dark side and animate to left
    setTimeout(() => {
      setDarkSide("left");
      setIsExpandingToLeft(false);
      setShouldAnimateToLeft(true);
      
      // Move to step 3 and animate content in
      setStep(3);
      setSuccess("Please enter your new password.");
      
      // After content animation completes
      setTimeout(() => {
        setShouldAnimateToLeft(false);
        setIsContentAnimating(false);
      }, 500);
    }, 500); // Wait for expansion animation to complete
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Reset password with the verified code
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete" && result.createdSessionId) {
        // Auto-sign in the user
        await setActive({ session: result.createdSessionId });
        setSuccess("Password reset successful! Redirecting...");
        
        // Redirect to home
        setTimeout(() => {
          window.location.href = "/home";
        }, 1000);
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const firstError = err.errors[0];
        setError(firstError?.longMessage || firstError?.message || "Failed to reset password");
      } else {
        setError("An unexpected error occurred. Please try again.");
        console.error("Non-Clerk error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShareUI 
      darkSide={darkSide}
      isExpanding={isAnimating || isExpandingToLeft} 
      shouldAnimateIn={shouldAnimateIn || shouldAnimateToLeft}
      backgroundImage="/images/image2.jpg"
    >
      <div className={`w-full max-w-md space-y-6 transition-all duration-500 ease-in-out ${
        isAnimating
          ? darkSide === "left" 
            ? "-translate-x-full opacity-0 scale-95"
            : "translate-x-full opacity-0 scale-95"
          : shouldAnimateIn || shouldAnimateToLeft
          ? darkSide === "left" 
            ? "-translate-x-full opacity-0 scale-95"
            : "translate-x-full opacity-0 scale-95"
          : "translate-x-0 opacity-100 scale-100"
      }`}>
        <div className={`transition-all duration-500 ease-in-out ${
          isAnimating
            ? darkSide === "left" 
              ? "-translate-x-full opacity-0 scale-95"
              : "translate-x-full opacity-0 scale-95"
            : isAnimatingToStep2 && step === 1
            ? "translate-x-full opacity-0 scale-95"
            : isAnimatingToStep2 && step === 2
            ? "translate-x-full opacity-0 scale-95"
            : (isContentAnimating && step === 2) 
            ? "translate-x-full opacity-0 scale-95" 
            : (isContentAnimating || shouldAnimateToLeft) && step === 3
            ? "-translate-x-full opacity-0 scale-95"
            : "translate-x-0 opacity-100 scale-100"
        }`}>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-gray-300">
            {step === 1 && "Enter your email to receive a verification code"}
            {step === 2 && "Enter the verification code sent to your email"}
            {step === 3 && "Enter your new password"}
          </p>
        </div>

        {error && (
          <div className={`p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-sm transition-all duration-500 ease-in-out ${
            isAnimating
              ? darkSide === "left" 
                ? "-translate-x-full opacity-0 scale-95"
                : "translate-x-full opacity-0 scale-95"
              : isAnimatingToStep2 && step === 1
              ? "translate-x-full opacity-0 scale-95"
              : isAnimatingToStep2 && step === 2
              ? "translate-x-full opacity-0 scale-95"
              : (isContentAnimating && step === 2) 
              ? "translate-x-full opacity-0 scale-95" 
              : (isContentAnimating || shouldAnimateToLeft) && step === 3
              ? "-translate-x-full opacity-0 scale-95"
              : "translate-x-0 opacity-100 scale-100"
          }`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`p-3 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg text-green-200 text-sm transition-all duration-500 ease-in-out ${
            isAnimating
              ? darkSide === "left" 
                ? "-translate-x-full opacity-0 scale-95"
                : "translate-x-full opacity-0 scale-95"
              : isAnimatingToStep2 && step === 1
              ? "translate-x-full opacity-0 scale-95"
              : isAnimatingToStep2 && step === 2
              ? "translate-x-full opacity-0 scale-95"
              : (isContentAnimating && step === 2) 
              ? "translate-x-full opacity-0 scale-95" 
              : (isContentAnimating || shouldAnimateToLeft) && step === 3
              ? "-translate-x-full opacity-0 scale-95"
              : "translate-x-0 opacity-100 scale-100"
          }`}>
            {success}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form 
            onSubmit={handleSendCode} 
            className={`space-y-4 transition-all duration-500 ease-in-out ${
              isAnimatingToStep2
                ? "translate-x-full opacity-0 scale-95"
                : "translate-x-0 opacity-100 scale-100"
            }`}
          >
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <form 
            onSubmit={handleVerifyCode} 
            className={`space-y-4 transition-all duration-500 ease-in-out ${
              isAnimating
                ? darkSide === "left" 
                  ? "-translate-x-full opacity-0 scale-95"
                  : "translate-x-full opacity-0 scale-95"
                : isAnimatingToStep2
                ? "translate-x-full opacity-0 scale-95"
                : isContentAnimating 
                ? "translate-x-full opacity-0 scale-95" 
                : "translate-x-0 opacity-100 scale-100"
            }`}
          >
            <div>
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
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!isLoaded || !signIn || resendCooldown > 0) return;
                  
                  setIsLoading(true);
                  setError(null);
                  
                  try {
                    // Get the email address ID from existing session
                    const supportedFirstFactors = signIn.supportedFirstFactors || [];
                    const emailFactor = supportedFirstFactors.find(
                      (factor: any) => factor.strategy === "reset_password_email_code"
                    ) as any;

                    if (!emailFactor || !emailFactor.emailAddressId) {
                      // If no existing session, create a new one
                      await signIn.create({
                        strategy: "reset_password_email_code",
                        identifier: email,
                      });
                    } else {
                      // Resend code using existing session
                      await signIn.prepareFirstFactor({
                        strategy: "reset_password_email_code",
                        emailAddressId: emailFactor.emailAddressId,
                      });
                    }
                    
                    setSuccess("New verification code sent!");
                    setResendCooldown(30);
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
        )}

        {/* Step 3: Enter New Password */}
        {step === 3 && (
          <form 
            onSubmit={handleResetPassword} 
            className={`space-y-4 transition-all duration-500 ease-in-out ${
              isAnimating
                ? darkSide === "left" 
                  ? "-translate-x-full opacity-0 scale-95"
                  : "translate-x-full opacity-0 scale-95"
                : isContentAnimating || shouldAnimateToLeft
                ? "-translate-x-full opacity-0 scale-95" 
                : "translate-x-0 opacity-100 scale-100"
            }`}
          >
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-white mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className={`text-center transition-all duration-500 ease-in-out ${
          isAnimating
            ? darkSide === "left" 
              ? "-translate-x-full opacity-0 scale-95"
              : "translate-x-full opacity-0 scale-95"
            : isAnimatingToStep2 && step === 1
            ? "translate-x-full opacity-0 scale-95"
            : isAnimatingToStep2 && step === 2
            ? "translate-x-full opacity-0 scale-95"
            : (isContentAnimating && step === 2) 
            ? "translate-x-full opacity-0 scale-95" 
            : (isContentAnimating || shouldAnimateToLeft) && step === 3
            ? "-translate-x-full opacity-0 scale-95"
            : "translate-x-0 opacity-100 scale-100"
        }`}>
          <button
            onClick={handleBackToSignIn}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </ShareUI>
  );
}

