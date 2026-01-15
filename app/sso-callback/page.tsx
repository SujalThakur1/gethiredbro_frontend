"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <>
      {/* Clerk CAPTCHA element for bot protection */}
      <div id="clerk-captcha" className="hidden"></div>
      <AuthenticateWithRedirectCallback />
    </>
  );
}

