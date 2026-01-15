/**
 * Safari CAPTCHA Handler
 * Removes CAPTCHA element for Safari users to prevent hanging
 * Safari blocks Cloudflare Turnstile cross-origin frames
 */

export function isSafari(): boolean {
  if (typeof window === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function removeCaptchaForSafari(): void {
  if (typeof window === "undefined") return;
  
  if (isSafari()) {
    // Remove CAPTCHA element so Clerk doesn't wait for it
    const captchaElement = document.getElementById("clerk-captcha");
    if (captchaElement) {
      captchaElement.remove();
    }
  }
}

export function getSafariErrorMessage(): string {
  return "Safari's privacy settings may be blocking authentication. Please disable 'Prevent Cross-Site Tracking' in Safari → Settings → Privacy, or use a different browser.";
}

