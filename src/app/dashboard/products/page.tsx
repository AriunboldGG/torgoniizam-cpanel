"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

import { Search, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import LotDetailModal from "@/components/lot-detail-modal";

// Flexible type — all fields from the API are preserved

type Lot = Record<string, unknown>;

// ── Field accessor helpers ────────────────────────────────────────────────────

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

function getNumber(lot: Lot, ...keys: string[]): number {
  const v = getField(lot, ...keys);

  return typeof v === "number"
    ? v
    : typeof v === "string"
      ? parseFloat(v) || 0
      : 0;
}

function getImages(lot: Lot): string[] {
  const v = getField(lot, "images", "photos", "image_urls", "media");

  if (Array.isArray(v)) {
    return v

      .map((i) =>
        typeof i === "string"
          ? i
          : typeof i === "object" && i !== null
            ? ((i as Record<string, string>).url ??
              (i as Record<string, string>).image ??
              "")
            : "",
      )

      .filter(Boolean);
  }

  const single = getString(lot, "image", "image_url", "thumbnail", "photo");

  return single ? [single] : [];
}

function getStatus(lot: Lot): string {
  return getString(lot, "status", "state", "lot_status").toUpperCase();
}

function getId(lot: Lot): string {
  return getString(lot, "id", "lot_id", "uuid", "pk");
}

function getName(lot: Lot): string {
  return getString(lot, "name", "title", "lot_name", "product_name");
}

function getCategory(lot: Lot): string {
  const raw = getField(lot, "category", "lot_type", "type");

  if (typeof raw === "string") return raw;

  if (typeof raw === "object" && raw !== null)
    return getString(raw as Lot, "name", "title", "label");

  return "";
}

// Render any value as a readable string for the "all fields" table

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return "—";

  if (typeof val === "boolean") return val ? "true" : "false";

  if (typeof val === "string" || typeof val === "number") return String(val);

  return JSON.stringify(val, null, 2);
}

// ── Status badge style ────────────────────────────────────────────────────────

function statusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case "ACTIVE":
      return { bg: "bg-emerald-500", text: "text-white" };

    case "ENDED":
      return { bg: "bg-blue-600", text: "text-white" };

    case "PENDING":
      return { bg: "bg-yellow-400", text: "text-black" };

    default:
      return { bg: "bg-gray-400", text: "text-white" };
  }
}

function formatMNT(n: number) {
  return "MNT " + n.toLocaleString("mn-MN");
}

// ── Normalise API list response to an array ───────────────────────────────────

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

export default function ProductListPage() {
  const [lots, setLots] = useState<Lot[]>([]);

  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setFetchError("Нэвтрэх шаардлагатай.");
      setLoading(false);
      return;
    }

    fetch("/api/lots", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())

      .then((data) => {
        if (data?.error) {
          setFetchError(data.error);
          return;
        }

        setLots(toArray(data));
      })

      .catch(() => setFetchError("Сервертэй холбогдоход алдаа гарлаа."))

      .finally(() => setLoading(false));
  }, []);

  const filtered = lots.filter((lot) => {
    const name = getName(lot).toLowerCase();

    const id = getId(lot).toLowerCase();

    const desc = getString(lot, "description", "body", "details").toLowerCase();

    const matchSearch =
      search === "" ||
      name.includes(search.toLowerCase()) ||
      id.includes(search.toLowerCase()) ||
      desc.includes(search.toLowerCase());

    const lotStatus = getStatus(lot);

    const matchStatus = statusFilter === "all" || lotStatus === statusFilter;

    return matchSearch && matchStatus;
  });

  function openModal(lot: Lot) {
    setSelectedLot(lot);
  }

  function closeModal() {
    setSelectedLot(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Product List</h1>

      {/* Filters */}

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1.5">Search Products</p>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

                <Input
                  placeholder="Search by name, ID..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1.5">Status</p>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v ?? "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>

                  {Array.from(
                    new Set(lots.map((l) => getStatus(l)).filter(Boolean)),
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span>Мэдээлэл ачааллаж байна...</span>
        </div>
      )}

      {/* Error */}

      {!loading && fetchError && (
        <div className="text-center py-16 text-red-500 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
          {fetchError}
        </div>
      )}

      {/* Empty */}

      {!loading && !fetchError && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          {lots.length === 0
            ? "Ð‘Ò¯Ñ‚ÑÑÐ³Ð´ÑÑ…Ò¯Ò¯Ð½ Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹."
            : "Хайлтад тохирох бүтээгдэхүүн байхгүй."}
        </div>
      )}

      {/* Product Grid */}

      {!loading && !fetchError && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((lot) => {
            const images = getImages(lot);

            const name = getName(lot);

            const id = getId(lot);
            const refNo = getString(lot, "reference_no", "ref_no", "lot_no");

            const desc = getString(lot, "description", "body", "details");

            const lotStatus = getStatus(lot);

            const badge = statusStyle(lotStatus);

            const yourPrice = getNumber(
              lot,
              "starting_price",
              "yourPrice",
              "price",
              "start_price",
            );

            const highestBid = getNumber(
              lot,
              "highest_bid",
              "current_bid",
              "highestBid",
              "max_bid",
            );

            const bids = getNumber(
              lot,
              "bids_count",
              "bids",
              "bid_count",
              "total_bids",
            );

            const category = getCategory(lot);

            const created = getString(
              lot,
              "created_at",
              "created",
              "date_created",
            );

            return (
              <Card
                key={id || JSON.stringify(lot)}
                className="overflow-hidden p-0"
              >
                {/* Image */}

                <div className="relative h-60 w-full bg-muted">
                  {images[0] ? (
                    <Image
                      src={images[0]}
                      alt={name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No image
                    </div>
                  )}

                  {lotStatus && (
                    <span
                      className={`absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                    >
                      {lotStatus}
                    </span>
                  )}
                </div>

                {/* Content */}

                <CardContent className="p-4 space-y-3">
                  <div>
                    {(refNo || id) && (
                      <p className="text-xs font-medium text-orange-500 mb-1 truncate">
                        {refNo || id}
                      </p>
                    )}

                    <h3 className="font-bold text-lg leading-tight">
                      {name || "—"}
                    </h3>

                    {desc && (
                      <p className="text-sm text-blue-500 mt-0.5 line-clamp-2">
                        {desc}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    {yourPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Starting Price:
                        </span>

                        <span className="font-medium">
                          {formatMNT(yourPrice)}
                        </span>
                      </div>
                    )}

                    {highestBid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Highest Bid:
                        </span>

                        <span className="font-semibold text-emerald-600">
                          {formatMNT(highestBid)}
                        </span>
                      </div>
                    )}

                    {bids > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bids:</span>

                        <span className="font-medium">{bids}</span>
                      </div>
                    )}

                    {category && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>

                        <span className="font-medium text-right">
                          {category}
                        </span>
                      </div>
                    )}

                    {created && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>

                        <span className="font-medium">{created}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => openModal(lot)}
                  >
                    Дэлгэрэнгүй үзэх
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}

      <LotDetailModal lot={selectedLot} onClose={closeModal} />
    </div>
  );
}
