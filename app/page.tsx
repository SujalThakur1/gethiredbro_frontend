"use client";

import { useState } from "react";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setSubmitted(true);
        form.reset();
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

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

        {submitted ? (
          <div className="p-6 bg-green-900/30 border border-green-500 rounded-lg">
            <p className="text-green-400 text-lg font-semibold">
              ✓ Thank you! We've received your suggestion.
            </p>
            <p className="text-green-300 text-sm mt-2">
              We'll be in touch when we implement it!
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-blue-400 hover:text-blue-300 underline text-sm"
            >
              Submit another suggestion
            </button>
          </div>
        ) : (
          <form
            action="https://formspree.io/f/xwvvvkav"
            method="POST"
            onSubmit={handleSubmit}
            className="space-y-4 text-left bg-gray-900/50 p-6 rounded-lg border border-gray-800"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
                Your Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-300">
                Feature Suggestion
              </label>
              <textarea
                name="message"
                id="message"
                required
                rows={5}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us what feature you'd like to see..."
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Submit Suggestion
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
