"use client";

export default function SummaryCardsSkeleton() {
  return (
    <div className="flex flex-col md:flex-row mb-8 gap-6 animate-pulse">
      <div className="bg-white border border-gray-200 rounded-2xl shadow p-6 w-full md:w-1/2 lg:w-1/3 h-36" />
      <div className="flex flex-1 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow p-6 flex-1 h-36" />
        <div className="bg-white border border-gray-200 rounded-2xl shadow p-6 flex-1 h-36" />
      </div>
    </div>
  );
}
