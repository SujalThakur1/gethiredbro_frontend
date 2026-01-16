"use client";

import { useForm, ValidationError } from '@formspree/react';

export default function Home() {
  const [state, handleSubmit] = useForm("xwvvvkav");

  if (state.succeeded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
        <div className="text-center space-y-8 max-w-2xl w-full">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">Get Hired Bro</h1>
            <p className="text-xl md:text-2xl text-gray-300">
              We're building an AI-powered platform that transforms your job search
            </p>
          </div>
          <div className="p-6 bg-green-900/30 border border-green-500 rounded-lg">
            <p className="text-green-400 text-lg font-semibold">
              ✓ Thank you! We've received your suggestion.
            </p>
            <p className="text-green-300 text-sm mt-2">
              We'll be in touch when we implement it!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="text-center space-y-8 max-w-2xl w-full">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold">Get Hired Bro</h1>
          <p className="text-xl md:text-2xl text-gray-300">
            We're building an AI-powered platform that transforms your job search
          </p>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Get job-specific CV optimization, AI-powered interview preparation tailored to each role, and intelligent job matching—all in one place.
          </p>
          <p className="text-base text-gray-500">
            Have a feature suggestion? Share it with us and get a <span className="text-blue-400 font-semibold">free subscription</span> when we launch!
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 text-left bg-gray-900/50 p-6 rounded-lg border border-gray-800"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
              Your Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
            <ValidationError
              prefix="Email"
              field="email"
              errors={state.errors}
              className="text-red-400 text-sm mt-1"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-300">
              Feature Suggestion
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tell us what feature you'd like to see..."
            />
            <ValidationError
              prefix="Message"
              field="message"
              errors={state.errors}
              className="text-red-400 text-sm mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={state.submitting}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.submitting ? "Submitting..." : "Submit Suggestion"}
          </button>
        </form>
      </div>
    </div>
  );
}