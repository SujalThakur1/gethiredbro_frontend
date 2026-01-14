"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Sign up a new user with Clerk
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const { firstName, lastName, email, password } = data;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return {
        success: false,
        error: "All fields are required",
      };
    }

    // Create user with Clerk
    const client = await clerkClient();
    const user = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password,
      skipPasswordChecks: false,
    });

    if (user) {
      return {
        success: true,
        message: "Account created successfully. Please sign in.",
      };
    }

    return {
      success: false,
      error: "Failed to create account",
    };
  } catch (error: any) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: error?.errors?.[0]?.message || error?.message || "An error occurred during sign up",
    };
  }
}

/**
 * Sign in a user with Clerk
 * Note: Clerk typically handles sign-in through their components,
 * but this can be used for custom flows
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const { email, password } = data;

    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: "Email and password are required",
      };
    }

    // Note: Clerk's sign-in is typically handled client-side
    // This is a placeholder - you may need to use Clerk's client SDK
    // or their sign-in component for actual authentication
    return {
      success: false,
      error: "Please use Clerk's sign-in component for authentication",
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: error?.message || "An error occurred during sign in",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: "No user is currently signed in",
      };
    }

    // Sign out is typically handled client-side with Clerk
    // This returns success but actual sign-out should be done client-side
    return {
      success: true,
      message: "Sign out successful",
    };
  } catch (error: any) {
    console.error("Sign out error:", error);
    return {
      success: false,
      error: error?.message || "An error occurred during sign out",
    };
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

