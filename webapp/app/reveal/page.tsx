"use client";

import { useState } from "react";
import type { ApiResponse, ResolvedIdentity } from "@/types/reveal";

export default function RevealPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse<ResolvedIdentity> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve() {
    if (!input.trim()) {
      setError("Please enter an ENS name or address");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Determine if input is an ENS name or address
      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(input.trim());
      const params = isAddress
        ? `?address=${encodeURIComponent(input.trim())}`
        : `?ens=${encodeURIComponent(input.trim())}`;

      const response = await fetch(`/api/reveal/resolve${params}`);
      const data: ApiResponse<ResolvedIdentity> = await response.json();

      setResult(data);
      if (!data.ok) {
        setError(data.error || "Failed to resolve");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reveal</h1>
          <p className="text-gray-600">
            Resolve ENS names and addresses to see identity information
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleResolve();
                }
              }}
              placeholder="Enter ENS name (e.g., vitalik.eth) or address (e.g., 0x...)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleResolve}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Resolving..." : "Resolve"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Step 0 & 1: ENS Name/Address Resolution
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Resolve ENS → Address and fetch ENS text records
            </p>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
