import { auth } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            You are signed in!
          </h1>
          <p className="text-gray-600">
            Welcome to your dashboard. You have successfully authenticated.
          </p>
        </div>
        
        <SignOutButton>
          <button className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors duration-200">
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}

