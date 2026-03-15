"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Star,
  Search,
  ExternalLink,
  Globe,
} from "lucide-react";

interface Clinic {
  name: string;
  address: string;
  phone: string;
  hours: string;
  distance: string;
  rating: number;
  ohip: boolean;
  uhip: boolean;
  specialties: string[];
  accepting: boolean;
  source?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ohip" | "uhip" | "dental">("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/clinics`);
        const data = await res.json();
        setClinics(data.clinics || []);
      } catch {
        // API unavailable
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = clinics.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter =
      filter === "all" ||
      (filter === "ohip" && c.ohip) ||
      (filter === "uhip" && c.uhip) ||
      (filter === "dental" && c.specialties.some((s) => s.toLowerCase().includes("dent")));
    return matchesSearch && matchesFilter;
  });

  const hasScrapedData = clinics.some((c) => c.source === "firecrawl");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a Clinic</h1>
          <p className="text-sm text-gray-500">
            OHIP and UHIP eligible healthcare providers near UofT
          </p>
        </div>
        {hasScrapedData && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-medium">
            <Globe className="w-3 h-3" />
            Live data via Firecrawl
          </span>
        )}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vigil-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "ohip", "uhip", "dental"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? "bg-emerald-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All" : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-48 rounded mb-3" />
              <div className="skeleton h-4 w-64 rounded mb-2" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((clinic, idx) => (
              <div key={`${clinic.name}-${idx}`} className="card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{clinic.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-gray-500">{clinic.rating}</span>
                      {clinic.distance && (
                        <>
                          <span className="text-xs text-gray-400 mx-1">|</span>
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{clinic.distance}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {clinic.ohip && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        OHIP
                      </span>
                    )}
                    {clinic.uhip && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        UHIP
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                  {clinic.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {clinic.address}
                    </div>
                  )}
                  {clinic.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 shrink-0" />
                      {clinic.phone}
                    </div>
                  )}
                  {clinic.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 shrink-0" />
                      {clinic.hours}
                    </div>
                  )}
                </div>

                {clinic.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {clinic.specialties.map((s) => (
                      <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  {clinic.accepting ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Accepting new patients
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not accepting new patients</span>
                  )}
                  {clinic.source === "firecrawl" && (
                    <span className="text-[10px] text-indigo-500 font-mono">scraped</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="card p-12 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No clinics match your search. Try adjusting your filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
