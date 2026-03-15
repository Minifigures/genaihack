"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
      <p className="text-sm text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Risk Heatmap</h1>
      <p className="text-sm text-gray-500 mb-6">
        Dental providers near UofT campus, colour-coded by fraud risk level.
      </p>
      <MapView />
    </div>
  );
}
