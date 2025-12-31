"use client";

import TestGraph from "@/components/dashboard/TestGraph";

export default function TestGraphPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-white text-2xl font-mono mb-4">Graph Test Page</h1>
      <p className="text-gray-400 text-sm font-mono mb-6">
        Open browser console to see debug output from TestGraph component
      </p>
      <TestGraph />
    </div>
  );
}
