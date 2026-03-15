"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getProviders } from "@/lib/api";
import type { ProviderStats } from "@/lib/api";

// Hardcoded lat/lng for demo providers near UofT campus
const PROVIDER_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "PRV-001": { lat: 43.6605, lng: -79.3955 },   // 123 University Ave
  "PRV-002": { lat: 43.6622, lng: -79.3987 },   // 45 St. George St
  "PRV-003": { lat: 43.6565, lng: -79.3835 },   // 789 Bay St
  "PRV-004": { lat: 43.6677, lng: -79.3995 },   // 200 Bloor St W
};

function getRiskColor(provider: ProviderStats): string {
  const devPct = provider.avg_fee_deviation * 100;

  if (provider.risk_tier === "confirmed_fraud" || devPct >= 60 || provider.flagged_claims >= 10) {
    return "#ef4444"; // red
  }
  if (provider.risk_tier === "flagged_multiple" || devPct >= 25 || provider.flagged_claims >= 5) {
    return "#f59e0b"; // amber
  }
  return "#22c55e"; // green
}

function getRiskLabel(provider: ProviderStats): string {
  const devPct = provider.avg_fee_deviation * 100;

  if (provider.risk_tier === "confirmed_fraud" || devPct >= 60 || provider.flagged_claims >= 10) {
    return "High Risk";
  }
  if (provider.risk_tier === "flagged_multiple" || devPct >= 25 || provider.flagged_claims >= 5) {
    return "Elevated Risk";
  }
  return "Low Risk";
}

function computeGrade(avgDeviation: number, flaggedClaims: number): string {
  const devPct = avgDeviation * 100;
  if (devPct < 10 && flaggedClaims === 0) return "A+";
  if (devPct < 15 && flaggedClaims === 0) return "A";
  if (devPct < 25 && flaggedClaims <= 1) return "B";
  if (devPct < 40 && flaggedClaims <= 2) return "C";
  if (devPct < 60 && flaggedClaims <= 3) return "D";
  return "F";
}

export default function MapView() {
  const [providers, setProviders] = useState<ProviderStats[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProviders();
        setProviders(data.providers);
      } catch {
        // API may not be running
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-2 bg-white rounded-lg border border-gray-200">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Level:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-600">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-600">Elevated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600">High / Critical</span>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <MapContainer
          center={[43.6629, -79.3957]}
          zoom={15}
          style={{ height: "550px", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {providers.map((provider) => {
            const location = PROVIDER_LOCATIONS[provider.provider_id];
            if (!location) return null;

            const color = getRiskColor(provider);
            const riskLabel = getRiskLabel(provider);
            const grade = computeGrade(provider.avg_fee_deviation, provider.flagged_claims);

            return (
              <CircleMarker
                key={provider.provider_id}
                center={[location.lat, location.lng]}
                radius={14}
                pathOptions={{
                  fillColor: color,
                  color: color,
                  weight: 2,
                  opacity: 0.9,
                  fillOpacity: 0.6,
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        {provider.provider_name}
                      </h3>
                      <span
                        className="text-lg font-black shrink-0"
                        style={{ color }}
                      >
                        {grade}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{provider.address}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Risk Level</span>
                        <span className="font-semibold" style={{ color }}>{riskLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Claims</span>
                        <span className="font-semibold">{provider.total_claims}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fraud Flags</span>
                        <span className="font-semibold text-red-600">{provider.flagged_claims}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Avg Deviation</span>
                        <span className="font-semibold">{(provider.avg_fee_deviation * 100).toFixed(0)}%</span>
                      </div>
                      {(provider.flagged_by_students ?? 0) > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-orange-600 font-medium">
                          {provider.flagged_by_students} students flagged
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
