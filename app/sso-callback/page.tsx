'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SSOCallback() {
  const router = useRouter()

  useEffect(() => {
    // Set a flag to indicate we're coming from SSO callback
    // This will be checked in the sign-in page to prevent showing error for manual URL navigation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fromSSOCallback', 'true')
    }
  }, [])

  return (
     <>
    <AuthenticateWithRedirectCallback
        signInUrl="/auth/sign-in?fromSSO=true"
        signUpUrl="/auth/sign-in?fromSSO=true"
        signInFallbackRedirectUrl="/home"
        signUpFallbackRedirectUrl="/home"
    />
    </>
  )
}

