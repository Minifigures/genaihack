"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Star,
  Search,
  ExternalLink,
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
}

const clinics: Clinic[] = [
  {
    name: "UofT Health & Wellness Centre",
    address: "214 College St, Toronto, ON M5T 2Z9",
    phone: "(416) 978-8030",
    hours: "Mon-Fri 9am-5pm",
    distance: "On campus",
    rating: 4.5,
    ohip: true,
    uhip: true,
    specialties: ["General", "Mental Health", "Dental Referrals"],
    accepting: true,
  },
  {
    name: "Harbord Dental Centre",
    address: "376 Harbord St, Toronto, ON M6G 1H8",
    phone: "(416) 923-3434",
    hours: "Mon-Sat 9am-6pm",
    distance: "0.5 km",
    rating: 4.3,
    ohip: false,
    uhip: true,
    specialties: ["General Dentistry", "Cleanings", "Fillings", "Crowns"],
    accepting: true,
  },
  {
    name: "Bloor West Dental Group",
    address: "2339 Bloor St W, Toronto, ON M6S 1P1",
    phone: "(416) 762-2312",
    hours: "Mon-Fri 8am-7pm, Sat 9am-4pm",
    distance: "1.2 km",
    rating: 4.6,
    ohip: false,
    uhip: true,
    specialties: ["General Dentistry", "Orthodontics", "Oral Surgery"],
    accepting: true,
  },
  {
    name: "College Spadina Health Centre",
    address: "720 Spadina Ave #200, Toronto, ON M5S 2T9",
    phone: "(416) 323-9772",
    hours: "Mon-Fri 9am-5pm",
    distance: "0.3 km",
    rating: 4.1,
    ohip: true,
    uhip: true,
    specialties: ["Walk-in", "General Practice", "Lab Work"],
    accepting: true,
  },
  {
    name: "Kensington Health",
    address: "25 Brunswick Ave, Toronto, ON M5S 2L9",
    phone: "(416) 967-1500",
    hours: "Mon-Fri 8:30am-4:30pm",
    distance: "0.8 km",
    rating: 4.4,
    ohip: true,
    uhip: true,
    specialties: ["Physiotherapy", "Mental Health", "Dental"],
    accepting: true,
  },
  {
    name: "Bathurst-College Medical Centre",
    address: "340 College St #500, Toronto, ON M5T 3A9",
    phone: "(416) 920-3535",
    hours: "Mon-Fri 9am-6pm",
    distance: "0.4 km",
    rating: 4.0,
    ohip: true,
    uhip: false,
    specialties: ["Family Medicine", "Dermatology", "Pharmacy"],
    accepting: false,
  },
  {
    name: "Smile Zone Dental",
    address: "181 University Ave #200, Toronto, ON M5H 3M7",
    phone: "(416) 361-9333",
    hours: "Mon-Sat 8am-8pm",
    distance: "1.5 km",
    rating: 4.7,
    ohip: false,
    uhip: true,
    specialties: ["General Dentistry", "Cosmetic", "Emergency"],
    accepting: true,
  },
  {
    name: "Annex Paramedical Clinic",
    address: "460 Bloor St W, Toronto, ON M5S 1X8",
    phone: "(416) 966-1204",
    hours: "Mon-Fri 10am-7pm, Sat 10am-3pm",
    distance: "0.6 km",
    rating: 4.2,
    ohip: true,
    uhip: true,
    specialties: ["Physiotherapy", "Chiropractic", "Massage Therapy", "Acupuncture"],
    accepting: true,
  },
];

export default function ClinicsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ohip" | "uhip" | "dental">("all");

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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a Clinic</h1>
          <p className="text-sm text-muted-foreground">
            OHIP and UHIP eligible healthcare providers near UofT
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "ohip", "uhip", "dental"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {f === "all" ? "All" : f.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((clinic) => (
          <Card key={clinic.name} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{clinic.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-muted-foreground">{clinic.rating}</span>
                    <span className="text-xs text-muted-foreground mx-1">|</span>
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{clinic.distance}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {clinic.ohip && (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]">
                      OHIP
                    </Badge>
                  )}
                  {clinic.uhip && (
                    <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-[10px]">
                      UHIP
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {clinic.address}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {clinic.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {clinic.hours}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {clinic.specialties.map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {clinic.accepting ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Accepting new patients
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not accepting new patients</span>
                )}
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  <ExternalLink className="w-3 h-3" />
                  Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">No clinics match your search. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
