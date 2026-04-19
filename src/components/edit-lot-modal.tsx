"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, CheckCircle2 } from "lucide-react";
import { assetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Lot = Record<string, unknown>;

const carFieldOptions = {
  condition: ["Шинэ", "Хуучин"],
  type: ["Sedan", "SUV", "Hatchback", "Crossover", "Pickup", "Van", "Coupe", "Minivan"],
  doors: ["2", "3", "4", "5"],
  steeringWheel: ["Зүүн", "Баруун"],
  driveType: ["FWD", "RWD", "AWD", "4WD"],
  yearOfManufacture: Array.from({ length: 36 }, (_, i) => String(2025 - i)),
  yearOfImport: Array.from({ length: 20 }, (_, i) => String(2025 - i)),
  engine: ["Бензин", "Дизель", "Цахилгаан", "Гибрид", "Байгалийн хий"],
  engineCapacity: [
    "1.0","1.2","1.3","1.4","1.5","1.6","1.8","2.0","2.2",
    "2.4","2.5","2.7","2.8","3.0","3.3","3.5","3.8","4.0","4.5","5.0","5.7","6.0+",
  ],
  gearbox: ["Автомат", "Механик", "Робот", "Вариатор"],
};

const emptyCarFields = (): Record<string, string> => ({
  condition: "", type: "", doors: "", steeringWheel: "", driveType: "",
  yearOfManufacture: "", yearOfImport: "", engine: "", engineCapacity: "",
  gearbox: "", interiorColor: "", mileage: "", color: "", chassis: "",
});

function isCatCar(lot: Lot): boolean {
  const raw = lot?.category;
  let name = "";
  if (typeof raw === "string") name = raw;
  else if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    name = String(obj.name ?? obj.title ?? obj.value ?? "");
  }
  const u = name.toUpperCase();
  return u.includes("АВТО") || u.includes("CAR") || u.includes("МАШИН");
}

const durations = ["1", "3", "6"];

function computeStartDateOptions() {
  const today = new Date();
  return [7, 14, 30].map((days) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    const formatted = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    const label =
      days === 7 ? "7 хоногийн дараа" : days === 14 ? "14 хоногийн дараа" : "30 хоногийн дараа";
    return { value: d.toISOString().split("T")[0], label: `${label} (${formatted})` };
  });
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "00") + ":00")
  .filter((h) => parseInt(h) >= 8);

function getString(lot: Lot, ...keys: string[]): string {
  for (const key of keys) {
    const v = lot[key];
    if (typeof v === "string" && v) return v;
    if (typeof v === "number") return String(v);
  }
  return "";
}

function getImages(lot: Lot): string[] {
  const v = lot.images ?? lot.photos ?? lot.image_urls;
  if (Array.isArray(v)) {
    return v.map((i) =>
      typeof i === "string" ? i :
      typeof i === "object" && i !== null ? ((i as Record<string, string>).url ?? (i as Record<string, string>).image ?? "") : ""
    ).filter(Boolean);
  }
  const single = getString(lot, "thumbnail", "image", "image_url", "photo");
  return single ? [single] : [];
}

interface EditLotModalProps {
  lot: Lot | null;
  onClose: () => void;
  onUpdated: (updated: Lot) => void;
}

export default function EditLotModal({ lot, onClose, onUpdated }: EditLotModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [bidIncrement, setBidIncrement] = useState("10000");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [carFields, setCarFields] = useState<Record<string, string>>(emptyCarFields());
  const setCarField = (key: string, val: string) =>
    setCarFields((prev) => ({ ...prev, [key]: val }));

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Pre-fill from lot data whenever the modal opens
  useEffect(() => {
    if (!lot) return;
    setName(getString(lot, "name", "title"));
    setDescription(getString(lot, "description", "body"));
    // Store raw price — do NOT re-apply the 10% fee (it was already baked in)
    const sp = lot.starting_price ?? lot.price;
    setPrice(sp ? String(sp) : "");
    const bi = lot.bid_increment;
    setBidIncrement(bi ? String(bi) : "10000");
    const dur = lot.duration;
    setDuration(dur ? String(dur) : "");
    const sd = getString(lot, "start_date", "starts_at", "auction_start");
    if (sd) {
      // Handle both "YYYY-MM-DD HH:MM:SS" and ISO "YYYY-MM-DDTHH:MM:SS" formats
      const normalized = sd.replace("T", " ").replace(/([+-]\d{2}:\d{2}|Z)$/, "").trim();
      const parts = normalized.split(" ");
      setStartDate(parts[0] ?? "");
      setStartTime(parts[1] ? parts[1].slice(0, 5) : "");
    } else {
      setStartDate("");
      setStartTime("");
    }
    setImagePaths(getImages(lot));
    // Initialize car attribute fields from existing lot attributes
    const attrsRaw = lot?.attributes;
    if (attrsRaw && typeof attrsRaw === "object" && !Array.isArray(attrsRaw)) {
      const attrs = attrsRaw as Record<string, unknown>;
      const filled = emptyCarFields();
      Object.keys(filled).forEach((k) => {
        if (attrs[k] !== undefined && attrs[k] !== null) filled[k] = String(attrs[k]);
      });
      setCarFields(filled);
    } else {
      setCarFields(emptyCarFields());
    }
    setSubmitError("");
    setSubmitSuccess(false);
  }, [lot]);

  const priceNum = Number(price.replace(/[^0-9]/g, "")) || 0;
  const startDateOptions = computeStartDateOptions();
  // If existing start_date not in the preset options, add it so the Select shows a value
  const allStartDateOptions = startDate && !startDateOptions.find((o) => o.value === startDate)
    ? [{ value: startDate, label: startDate }, ...startDateOptions]
    : startDateOptions;
  // If existing time/duration not in preset options, add them so the Select shows a value
  const allTimeOptions: string[] = startTime && !hourOptions.includes(startTime)
    ? [startTime, ...hourOptions]
    : hourOptions;
  const allDurations: string[] = duration && !durations.includes(duration)
    ? [duration, ...durations]
    : durations;

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setUploadingCount((n) => n + files.length);
    await Promise.all(
      Array.from(files).map(async (file) => {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/v1/file/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          const data = await res.json().catch(() => ({}));
          const path: string | undefined = data?.data?.path;
          if (path) setImagePaths((prev) => [...prev, path]);
        } catch {
          // skip failed file silently
        } finally {
          setUploadingCount((n) => n - 1);
        }
      })
    );
  };

  const removeImage = (idx: number) => setImagePaths((prev) => prev.filter((_, i) => i !== idx));

  async function handleSubmit() {
    setSubmitError("");
    if (!name.trim()) { setSubmitError("Бүтээгдэхүүний нэр оруулна уу."); return; }
    if (!price) { setSubmitError("Үнэ оруулна уу."); return; }
    if (!duration) { setSubmitError("Үргэлжлэх хугацаа сонгоно уу."); return; }
    if (!startDate || !startTime) { setSubmitError("Эхлэх огноо болон цаг сонгоно уу."); return; }
    const token = localStorage.getItem("access_token");
    if (!token) { setSubmitError("Нэвтрэх шаардлагатай."); return; }

    const lotId = String(lot?.id ?? lot?.lot_id ?? lot?.uuid ?? lot?.pk ?? "");
    if (!lotId) { setSubmitError("Lot ID олдсонгүй."); return; }

    setSubmitting(true);
    try {
      // Preserve category and attributes from the original lot
      const catRaw = lot?.category;
      const categoryId = catRaw && typeof catRaw === "object"
        ? Number((catRaw as Record<string, unknown>).id ?? (catRaw as Record<string, unknown>).key ?? 0)
        : Number(catRaw ?? 0);

      const isCar = isCatCar(lot ?? {});
      const attributes: Record<string, string> = {};
      if (isCar) {
        Object.entries(carFields).forEach(([k, v]) => { if (v) attributes[k] = v; });
      } else {
        // preserve existing attributes as-is for non-car lots
        const attrsRaw = lot?.attributes;
        if (attrsRaw && typeof attrsRaw === "object" && !Array.isArray(attrsRaw)) {
          Object.assign(attributes, attrsRaw as Record<string, unknown>);
        }
      }

      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        category: categoryId,
        starting_price: priceNum,
        bid_increment: Number(bidIncrement) || 10000,
        duration: Number(duration),
        start_date: `${startDate} ${startTime}:00`,
        use_user_address: true,
        attributes,
      };
      if (imagePaths.length > 0) {
        body.images = imagePaths;
      }

      console.log("[update body]", body);

      const res = await fetch(`/api/v1/lot/update/${lotId}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      console.log("[update response]", { status: res.status, ok: res.ok, data });

      if (!res.ok || data?.status_code === "ng") {
        let msg = typeof data?.msg === "string" ? data.msg : "";
        const inner = data?.data;
        if (inner && typeof inner === "object") {
          const fields = Object.entries(inner)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? (v as unknown[]).join(", ") : String(v)}`)
            .join(" | ");
          if (fields) msg += " — " + fields;
        }
        if (!msg) msg = data?.detail ?? data?.error ?? JSON.stringify(data);
        setSubmitError(msg || "Алдаа гарлаа.");
        return;
      }

      // Upload images via the dedicated lot upload endpoint
      if (imagePaths.length > 0) {
        await fetch(`/api/v1/lot/upload/${lotId}/`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ images: imagePaths }),
        });
      }

      setSubmitSuccess(true);
      onUpdated({ ...lot, ...data?.data ?? data });
      setTimeout(onClose, 1200);
    } catch (err) {
      setSubmitError("Сервертэй холбогдоход алдаа гарлаа: " + String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!lot} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Бүтээгдэхүүн засах</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Бүтээгдэхүүний нэр <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., TOYOTA LAND CRUISER 250" />
          </div>

          {/* Car attributes */}
          {lot && (() => {
            if (isCatCar(lot)) return true;
            // Also show if lot already has any car attribute keys stored
            const attrsRaw = lot?.attributes;
            if (attrsRaw && typeof attrsRaw === "object" && !Array.isArray(attrsRaw)) {
              const attrs = attrsRaw as Record<string, unknown>;
              return Object.keys(emptyCarFields()).some(
                (k) => attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== ""
              );
            }
            return false;
          })() && (
            <div className="space-y-3">
              <p className="font-semibold text-sm">Автомашины мэдээлэл</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ["condition", "Нөхцөл (Condition)"],
                  ["type", "Төрөл (Type)"],
                  ["doors", "Хаалга (Doors)"],
                  ["steeringWheel", "Тээвэр (Steering Wheel)"],
                  ["driveType", "Хөтлөгч (Drive Type)"],
                  ["yearOfManufacture", "Үйлдвэрлэсэн он"],
                  ["yearOfImport", "Орж ирсэн он"],
                  ["engine", "Хөдөлгүүр (Engine)"],
                  ["engineCapacity", "Мотор багтаамж (Engine Capacity)"],
                  ["gearbox", "Хурдны хайрцаг (Gearbox)"],
                ] as [keyof typeof carFieldOptions, string][]).map(([field, label]) => {
                  const opts = carFieldOptions[field];
                  const val = carFields[field] ?? "";
                  const allOpts = val && !opts.includes(val) ? [val, ...opts] : opts;
                  return (
                    <div key={field} className="space-y-1.5">
                      <Label>{label}</Label>
                      <Select value={val} onValueChange={(v) => setCarField(field, v ?? "")}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {allOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
                <div className="space-y-1.5">
                  <Label>Дотор өнгө (Interior Color)</Label>
                  <Input value={carFields.interiorColor ?? ""} onChange={(e) => setCarField("interiorColor", e.target.value)} placeholder="e.g., Хар, Саарал..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Явсан (Mileage)</Label>
                  <div className="relative">
                    <Input value={carFields.mileage ?? ""} onChange={(e) => setCarField("mileage", e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g., 80000" className="pr-10" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">KM</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Өнгө (Color)</Label>
                  <Input value={carFields.color ?? ""} onChange={(e) => setCarField("color", e.target.value)} placeholder="e.g., Цагаан, Хар..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Арлын дугаар (Chassis / VIN)</Label>
                  <Input value={carFields.chassis ?? ""} onChange={(e) => setCarField("chassis", e.target.value)} placeholder="e.g., JT1234567890" />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Тайлбар <span className="text-red-500">*</span></Label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Барааны тайлбар..."
            />
          </div>

          {/* Price + Bid Increment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <Label>Үнэ (Price) <span className="text-red-500">*</span></Label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g., 12000000"
              />
            </div>
          </div>
          {priceNum > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
              <div className="flex justify-between font-bold">
                <span>Starting Price:</span>
                <span>{priceNum.toLocaleString()} MNT</span>
              </div>
            </div>
          )}

      

          {/* Duration + Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Үргэлжлэх хугацаа (Цаг) <span className="text-red-500">*</span></Label>
              <Select value={duration} onValueChange={(v) => setDuration(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {allDurations.map((d) => <SelectItem key={d} value={d}>{d} цаг</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Эхлэх огноо <span className="text-red-500">*</span></Label>
              <Select value={startDate} onValueChange={(v) => { setStartDate(v ?? ""); setStartTime(""); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {allStartDateOptions.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {startDate && (
                <div className="space-y-1.5 pt-1">
                  <Label>Эхлэх цаг <span className="text-red-500">*</span></Label>
                  <Select value={startTime} onValueChange={(v) => setStartTime(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {allTimeOptions.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Зурагнууд</Label>
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                <Plus className="h-4 w-4" />
                Зураг нэмэх
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => uploadImages(e.target.files)}
                />
              </label>
            </div>
            {uploadingCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadingCount} зураг upload хийж байна...
              </div>
            )}
            {imagePaths.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imagePaths.map((path, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl(path)}
                      alt={`img-${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-blue-600 text-white py-0.5">
                        Голлогч
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback */}
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Бүтээгдэхүүн шинэчилж байна. Түр хүлээнэ үү...
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>Цуцлах</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={handleSubmit}
              disabled={submitting || submitSuccess}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Хадгалах
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
