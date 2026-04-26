"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Package,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
  ArchiveX,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────────

type Lot = Record<string, unknown>;

// ── Helpers (mirrors products page logic) ─────────────────────────────────────

function getField(lot: Lot, ...keys: string[]): unknown {
  for (const key of keys) {
    if (lot[key] !== undefined && lot[key] !== null) return lot[key];
  }
  return undefined;
}

function getString(lot: Lot, ...keys: string[]): string {
  const v = getField(lot, ...keys);
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

function getStatus(lot: Lot): string {
  const raw = getField(lot, "status", "state", "lot_status", "lot_state", "auction_status");
  if (raw && typeof raw === "object") {
    const key = (raw as Record<string, unknown>).key;
    if (key !== undefined) return String(key).toLowerCase();
  }
  if (typeof raw === "string") return raw.toLowerCase();
  if (lot.is_active === true) return "active";
  return "other";
}

function getCategory(lot: Lot): string {
  const raw = getField(lot, "category", "lot_type", "type");
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null)
    return getString(raw as Lot, "name", "title", "label");
  return "Бусад";
}

function toArray(data: unknown): Lot[] {
  if (Array.isArray(data)) return data as Lot[];
  if (data && typeof data === "object") {
    for (const key of ["results", "data", "lots", "items", "list"]) {
      const v = (data as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as Lot[];
    }
  }
  return [];
}

// ── Constants ──────────────────────────────────────────────────────────────────

// Well-known status styling — keys should match what the backend sends in status.key
const STATUS_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  active:      { color: "#10b981", icon: <CheckCircle  className="h-5 w-5" /> },
  pending:     { color: "#f59e0b", icon: <Clock        className="h-5 w-5" /> },
  ended:       { color: "#6b7280", icon: <ArchiveX     className="h-5 w-5" /> },
  rejected:    { color: "#ef4444", icon: <XCircle      className="h-5 w-5" /> },
  sold:        { color: "#8b5cf6", icon: <ShoppingCart className="h-5 w-5" /> },
  new:         { color: "#06b6d4", icon: <Package      className="h-5 w-5" /> },
  moderation:  { color: "#f59e0b", icon: <Clock        className="h-5 w-5" /> },
  won:         { color: "#8b5cf6", icon: <ShoppingCart className="h-5 w-5" /> },
  cancelled:   { color: "#ef4444", icon: <XCircle      className="h-5 w-5" /> },
  closed:      { color: "#3b82f6", icon: <ArchiveX     className="h-5 w-5" /> },
};

// Fallback: match by Mongolian label when backend key is numeric or unknown
const LABEL_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  "Идэвхтэй":      { color: "#10b981", icon: <CheckCircle  className="h-5 w-5" /> },
  "Хүлээгдэж буй": { color: "#f59e0b", icon: <Clock        className="h-5 w-5" /> },
  "Дууссан":       { color: "#6b7280", icon: <ArchiveX     className="h-5 w-5" /> },
  "Татгалзсан":    { color: "#ef4444", icon: <XCircle      className="h-5 w-5" /> },
  "Зарагдсан":     { color: "#8b5cf6", icon: <ShoppingCart className="h-5 w-5" /> },
};

const PALETTE = [
  "#6366f1","#10b981","#f59e0b","#3b82f6","#ef4444",
  "#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899",
];

function styleForStatus(key: string, idx: number, label?: string): { color: string; icon: React.ReactNode } {
  return (
    STATUS_STYLE[key] ??
    (label ? LABEL_STYLE[label] : undefined) ??
    { color: PALETTE[idx % PALETTE.length], icon: <Package className="h-5 w-5" /> }
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  // Map of status key → human-readable label, built from actual API responses
  const [statusLabels, setStatusLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setError("Нэвтрээгүй байна"); setLoading(false); return; }

    fetch("/api/lots?limit=500&offset=0", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const arr = toArray(data);
        // Build label map from { key, value } status objects in the response
        const map: Record<string, string> = {};
        arr.forEach((lot) => {
          const raw = getField(lot, "status", "state", "lot_status", "lot_state", "auction_status");
          if (raw && typeof raw === "object") {
            const k = (raw as Record<string, unknown>).key;
            const v = (raw as Record<string, unknown>).value;
            if (k !== undefined && v !== undefined)
              map[String(k).toLowerCase()] = String(v);
          }
        });
        setStatusLabels(map);
        setLots(arr);
        setLoading(false);
      })
      .catch(() => { setError("Өгөгдөл татахад алдаа гарлаа"); setLoading(false); });
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const statusCounts = lots.reduce<Record<string, number>>((acc, lot) => {
    const s = getStatus(lot);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  // All distinct status keys actually present in the data, sorted by count desc
  const allStatusKeys = Object.keys(statusCounts).sort(
    (a, b) => statusCounts[b] - statusCounts[a]
  );

  const pieData = allStatusKeys.map((key, i) => {
    const label = statusLabels[key] ?? key;
    return { name: label, value: statusCounts[key], color: styleForStatus(key, i, label).color };
  });

  const barData = lots
    .map((lot) => ({
      name: getString(lot, "title", "name", "lot_name", "product_name") || String(getField(lot, "id") ?? ""),
      count: Number(getField(lot, "participant_count") ?? 0),
    }))
    .filter((item) => item.name !== "" && item.name !== "Бусад")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Бүтээгдэхүүний мэдээлэл</h1>
          <p className="text-sm text-muted-foreground">
            Нийт {lots.length} бүтээгдэхүүний статистик мэдээлэл
          </p>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="col-span-2 sm:col-span-3 lg:col-span-1 border-l-4" style={{ borderLeftColor: "#6366f1" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Нийт</CardTitle>
            <Package className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lots.length}</p>
          </CardContent>
        </Card>

        {allStatusKeys.map((s, i) => {
          const label = statusLabels[s] ?? s;
          const { color, icon } = styleForStatus(s, i, label);
          const count = statusCounts[s] ?? 0;
          const pct = lots.length > 0 ? Math.round((count / lots.length) * 100) : 0;
          return (
            <Card key={s} className="border-l-4" style={{ borderLeftColor: color }}>
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <span style={{ color }}>{icon}</span>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статусын хуваарилалт</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Өгөгдөл байхгүй</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Тоо"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar chart — top categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ангиллаар (топ 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Өгөгдөл байхгүй</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Оролцогчид" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Статусын дэлгэрэнгүй</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium text-muted-foreground">Статус</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Тоо</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Хувь</th>
                  <th className="py-2 pl-4 text-left font-medium text-muted-foreground">Харьцаа</th>
                </tr>
              </thead>
              <tbody>
                {allStatusKeys.map((s, i) => {
                    const label = statusLabels[s] ?? s;
                    const { color, icon } = styleForStatus(s, i, label);
                    const count = statusCounts[s] ?? 0;
                    const pct = lots.length > 0 ? (count / lots.length) * 100 : 0;
                    return (
                      <tr key={s} className="border-b last:border-0">
                        <td className="py-3 flex items-center gap-2" style={{ color }}>
                          {icon}
                          <span className="font-medium text-foreground">{label}</span>
                        </td>
                        <td className="py-3 text-right font-bold">{count}</td>
                        <td className="py-3 text-right text-muted-foreground">{pct.toFixed(1)}%</td>
                        <td className="py-3 pl-4 w-48">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
