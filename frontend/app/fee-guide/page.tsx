"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, BookOpen, AlertTriangle } from "lucide-react";

interface FeeEntry {
  code: string;
  description: string;
  suggestedFee: number;
  category: string;
  highRisk: boolean;
}

const feeGuide: FeeEntry[] = [
  { code: "11101", description: "Exam, recall", suggestedFee: 78.00, category: "Diagnostic", highRisk: false },
  { code: "11102", description: "Exam, complete", suggestedFee: 120.00, category: "Diagnostic", highRisk: false },
  { code: "01202", description: "Radiographs, periapical, 2 films", suggestedFee: 42.00, category: "Diagnostic", highRisk: false },
  { code: "01301", description: "Panoramic radiograph", suggestedFee: 85.00, category: "Diagnostic", highRisk: false },
  { code: "01401", description: "Full mouth series", suggestedFee: 155.00, category: "Diagnostic", highRisk: false },
  { code: "11111", description: "Scaling, first unit", suggestedFee: 55.00, category: "Preventive", highRisk: false },
  { code: "11117", description: "Scaling, additional unit", suggestedFee: 55.00, category: "Preventive", highRisk: true },
  { code: "21111", description: "Amalgam restoration, 1 surface", suggestedFee: 125.00, category: "Restorative", highRisk: false },
  { code: "21112", description: "Amalgam restoration, 2 surfaces", suggestedFee: 160.00, category: "Restorative", highRisk: false },
  { code: "23111", description: "Composite restoration, 1 surface, anterior", suggestedFee: 150.00, category: "Restorative", highRisk: false },
  { code: "23112", description: "Composite restoration, 2 surfaces, anterior", suggestedFee: 190.00, category: "Restorative", highRisk: false },
  { code: "25201", description: "Prefabricated crown, primary", suggestedFee: 240.00, category: "Restorative", highRisk: false },
  { code: "27201", description: "Crown, porcelain fused to metal", suggestedFee: 1100.00, category: "Prosthodontics", highRisk: true },
  { code: "27211", description: "Crown, full cast metal", suggestedFee: 950.00, category: "Prosthodontics", highRisk: true },
  { code: "32111", description: "Extraction, single tooth", suggestedFee: 135.00, category: "Oral Surgery", highRisk: false },
  { code: "32211", description: "Surgical extraction", suggestedFee: 245.00, category: "Oral Surgery", highRisk: false },
  { code: "33111", description: "Extraction, deciduous tooth", suggestedFee: 95.00, category: "Oral Surgery", highRisk: false },
  { code: "41101", description: "Pulpotomy", suggestedFee: 180.00, category: "Endodontics", highRisk: false },
  { code: "43421", description: "Root planing, per quadrant", suggestedFee: 195.00, category: "Periodontics", highRisk: true },
  { code: "43427", description: "Root planing, 3+ quadrants", suggestedFee: 185.00, category: "Periodontics", highRisk: true },
];

const categories = Array.from(new Set(feeGuide.map((f) => f.category)));

export default function FeeGuidePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = feeGuide.filter((entry) => {
    const matchesSearch =
      search === "" ||
      entry.code.includes(search) ||
      entry.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Guide</h1>
          <p className="text-sm text-muted-foreground">
            ODA 2024 suggested fees for common dental procedures
          </p>
        </div>
      </div>

      {/* Search and category filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by code or procedure name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !selectedCategory ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedCategory === cat ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Info card */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-blue-800">
            These are suggested fees from the Ontario Dental Association (ODA) fee guide.
            Your dentist may charge more or less. If your bill exceeds these amounts by more than 15%,
            VIGIL will flag it for review. Codes marked with a warning icon are frequently associated with billing anomalies.
          </p>
        </CardContent>
      </Card>

      {/* Fee table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">ODA Fee</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.code}>
                  <TableCell className="font-mono font-medium">{entry.code}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{entry.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${entry.suggestedFee.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {entry.highRisk && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No procedures match your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
