"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, CheckCircle2 } from "lucide-react";
import { assetUrl } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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

type Category = { key: number | string; value: string };

const carFieldOptions = {
  condition: ["Шинэ", "Хуучин"],
  type: ["Sedan", "SUV", "Hatchback", "Crossover", "Pickup", "Van", "Coupe", "Minivan"],
  doors: ["2", "3", "4", "5"],
  steeringWheel: ["Зүүн", "Баруун"],
  driveType: ["FWD", "RWD", "AWD", "4WD"],
  yearOfManufacture: Array.from({ length: 36 }, (_, i) => String(2025 - i)),
  yearOfImport: Array.from({ length: 20 }, (_, i) => String(2025 - i)),
  engine: ["Бензин", "Дизель", "Цахилгаан", "Гибрид"],
  engineCapacity: [
    "1.0","1.2","1.3","1.4","1.5","1.6","1.8","2.0","2.2",
    "2.4","2.5","2.7","2.8","3.0","3.3","3.5","3.8","4.0","4.5","5.0","5.7","6.0+",
  ],
  gearbox: ["Автомат", "Механик", "Робот", "Вариатор"],
  interiorColor: ["Хар", "Саарал", "Цагаан", "Бор", "Бежевый", "Улаан", "Цэнхэр"],
  color: ["Цагаан","Хар","Мөнгө","Саарал","Улаан","Цэнхэр","Ногоон","Шар","Хүрэн","Бор"],
};

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

const isNum = (v: unknown) =>
  typeof v === "number" || (typeof v === "string" && v !== "" && /^\d+$/.test(String(v)));

function parseCategoryList(raw: Record<string, unknown>[]): Category[] {
  return raw.map((item) => {
    if (item.id !== undefined && isNum(item.id))
      return { key: Number(item.id), value: String(item.name ?? item.value ?? item.key ?? "") };
    if (item.key !== undefined && item.value !== undefined) {
      if (isNum(item.key) && !isNum(item.value)) return { key: Number(item.key), value: String(item.value) };
      if (!isNum(item.key) && isNum(item.value)) return { key: Number(item.value), value: String(item.key) };
    }
    return { key: Number(item.id ?? item.key ?? 0), value: String(item.name ?? item.value ?? "") };
  });
}

function parseChildCategoryList(rawArr: unknown[]): Category[] {
  return rawArr.map((unknownItem) => {
    const item = unknownItem as Record<string, unknown>;
    const idFields = ["id", "pk", "subcategory_id", "cat_id"];
    const nameFields = ["name", "label", "title", "display_name"];
    for (const idField of idFields) {
      if (item[idField] !== undefined && isNum(item[idField])) {
        const nameCandidate = nameFields.map((f) => item[f]).find((v) => v !== undefined && v !== null);
        return {
          key: item[idField] as number | string,
          value: nameCandidate != null ? String(nameCandidate) : String(item[idField]),
        };
      }
    }
    const k = item["key"];
    const v = item["value"];
    if (k !== undefined && v !== undefined) {
      if (isNum(k) && !isNum(v)) return { key: k as number | string, value: String(v) };
      if (!isNum(k) && isNum(v)) return { key: v as number | string, value: String(k) };
      if (isNum(k)) return { key: k as number | string, value: String(v) };
      return { key: v as number | string, value: String(k) };
    }
    return { key: String(item["id"] ?? item["key"] ?? ""), value: String(item["name"] ?? item["value"] ?? "") };
  });
}

export default function AddProductForm() {
  const router = useRouter();

  // ── Categories ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [childLoading, setChildLoading] = useState(false);

  // ── General fields ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [categoryKey, setCategoryKey] = useState<number | string>("");
  const [subCategory, setSubCategory] = useState("");
  const [subCategoryKey, setSubCategoryKey] = useState<number | string>("");

  // ── Auction settings ──
  const [bidIncrement, setBidIncrement] = useState("10000");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  // ── Car fields ──
  const [carFields, setCarFields] = useState<Record<string, string>>({
    condition: "", type: "", doors: "", steeringWheel: "", driveType: "",
    yearOfManufacture: "", yearOfImport: "", engine: "", engineCapacity: "",
    gearbox: "", interiorColor: "", mileage: "", color: "", chassis: "",
  });
  const setCarField = (key: string, val: string) =>
    setCarFields((prev) => ({ ...prev, [key]: val }));

  // ── Images ──
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  // ── Submission ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load parent categories
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setCatsLoading(false); return; }
    fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const raw: Record<string, unknown>[] =
          Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.results) ? data.results
          : (Object.values(data ?? {}).find((v) => Array.isArray(v)) as Record<string, unknown>[]) ?? [];
        setCategories(parseCategoryList(raw));
      })
      .catch(() => {})
      .finally(() => setCatsLoading(false));
  }, []);

  // Load child categories when parent changes
  useEffect(() => {
    if (!categoryKey) { setChildCategories([]); setSubCategory(""); setSubCategoryKey(""); return; }
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setChildLoading(true);
    setSubCategory("");
    setSubCategoryKey("");
    fetch(`/api/categories/${categoryKey}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const rawArr: unknown[] =
          Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.results) ? data.results
          : (Object.values(data ?? {}).find((v) => Array.isArray(v)) as unknown[]) ?? [];
        setChildCategories(parseChildCategoryList(rawArr));
      })
      .catch(() => {})
      .finally(() => setChildLoading(false));
  }, [categoryKey]);

  const catUpper = category.toUpperCase();
  const isCar = catUpper.includes("АВТО") || catUpper.includes("CAR") || catUpper.includes("МАШИН");

  const priceNum = Number(price.replace(/[^0-9]/g, "")) || 0;
  const systemFee = Math.round(priceNum * 0.1);
  const auctionStartingPrice = priceNum + systemFee;
  const startDateOptions = computeStartDateOptions();
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0") + ":00")
    .filter((h) => parseInt(h) >= 8 && (!duration || parseInt(h) + Number(duration) <= 24));

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

  const removeImage = (idx: number) =>
    setImagePaths((prev) => prev.filter((_, i) => i !== idx));

  async function handleSubmit() {
    setSubmitError("");
    if (!name.trim()) { setSubmitError("Бүтээгдэхүүний нэр оруулна уу."); return; }
    if (!categoryKey) { setSubmitError("Ангилал сонгоно уу."); return; }
    if (childCategories.length > 0 && !subCategoryKey) { setSubmitError("Дэд ангилал сонгоно уу."); return; }
    if (!price) { setSubmitError("Үнэ оруулна уу."); return; }
    if (!duration) { setSubmitError("Үргэлжлэх хугацаа сонгоно уу."); return; }
    if (!startDate || !startTime) { setSubmitError("Эхлэх огноо болон цаг сонгоно уу."); return; }
    const token = localStorage.getItem("access_token");
    if (!token) { setSubmitError("Нэвтрэх шаардлагатай."); return; }

    setSubmitting(true);
    try {
      const attrsObj: Record<string, string> = {};
      if (isCar) {
        Object.entries(carFields).forEach(([k, v]) => { if (v) attrsObj[k] = v; });
      }

      const finalCategory =
        subCategoryKey !== "" && subCategoryKey !== null && subCategoryKey !== undefined
          ? (subCategoryKey as number)
          : (categoryKey as number);

      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        category: finalCategory,
        starting_price: auctionStartingPrice,
        bid_increment: Number(bidIncrement) || 10000,
        duration: Number(duration),
        start_date: `${startDate} ${startTime}:00`,
        use_user_address: true,
        attributes: attrsObj,
      };

      if (imagePaths.length > 0) {
        body.images = imagePaths;
      }

      const res = await fetch("/api/v1/lot/insert/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.status_code === "ng") {
        let msg = typeof data?.msg === "string" ? data.msg : "";
        const inner = data?.data;
        if (inner && typeof inner === "object") {
          const flatVal = (v: unknown): string => {
            if (typeof v === "string") return v;
            if (Array.isArray(v)) return v.map(flatVal).join(", ");
            if (v && typeof v === "object") {
              const o = v as Record<string, unknown>;
              return o.message ? String(o.message) : o.detail ? String(o.detail) : JSON.stringify(o);
            }
            return String(v);
          };
          const fields = Object.entries(inner).map(([k, v]) => `${k}: ${flatVal(v)}`).join(" | ");
          if (fields) msg += " — " + fields;
        }
        if (!msg) msg = data?.detail ?? data?.error ?? JSON.stringify(data);
        setSubmitError(msg || "Алдаа гарлаа.");
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => router.push("/dashboard/products"), 1500);
    } catch (err) {
      setSubmitError("Сервертэй холбогдоход алдаа гарлаа: " + String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* General Info */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <h2 className="font-bold text-lg">Ерөнхий мэдээлэл</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Бүтээгдэхүүний нэр <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g., TOYOTA LAND CRUISER 250"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ангилал <span className="text-red-500">*</span></Label>
              <Select
                value={categoryKey !== "" ? String(categoryKey) : ""}
                onValueChange={(v) => {
                  const found = categories.find((c) => String(c.key) === v);
                  setCategory(found?.value ?? "");
                  setCategoryKey(Number(v));
                  setSubCategory("");
                  setSubCategoryKey("");
                  setChildCategories([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={catsLoading ? "Ачааллаж байна..." : "Ангилал сонгоно уу"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={String(c.key)} value={String(c.key)}>{c.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {childLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Дэд ангилал ачааллаж байна...
            </div>
          )}
          {!childLoading && childCategories.length > 0 && (
            <div className="space-y-1.5">
              <Label>Дэд ангилал <span className="text-red-500">*</span></Label>
              <Select
                value={subCategoryKey !== "" && subCategoryKey !== undefined ? String(subCategoryKey) : ""}
                onValueChange={(v) => {
                  const found = childCategories.find((c) => String(c.key) === v);
                  setSubCategoryKey(Number(v));
                  setSubCategory(found?.value ?? "");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Дэд ангилал сонгоно уу" />
                </SelectTrigger>
                <SelectContent>
                  {childCategories.map((c) => (
                    <SelectItem key={String(c.key)} value={String(c.key)}>{c.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Тайлбар оруулна уу <span className="text-red-500">*</span></Label>
            <textarea
              rows={4}
              placeholder="Барааны дэлгэрэнгүй танилцуулга оруулна уу..."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <Label>Үнэ (Price) <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g., 12000000"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
              />
              {/* <p className="text-xs text-muted-foreground">
                Үнийн дүнг бүх тагтай нь оруулна уу. Жишээ нь: 12 сайн 12000000 гэж оруулна уу.
              </p> */}
            </div>

            {priceNum > 0 && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                <p className="font-semibold">Дуудлага худалдаа эхлэх үнэ (MNT)</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Таны үнэ:</span>
                    <span>{priceNum.toLocaleString()} MNT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Системийн шимтгэл(10%):</span>
                    <span className="text-orange-500">+{systemFee.toLocaleString()} MNT</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-bold">
                    <span>Дуудлага худалдаа эхлэх үнэ:</span>
                    <span>{auctionStartingPrice.toLocaleString()} MNT</span>
                  </div>
                </div>
               
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Info — car category only */}
      {isCar && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-bold text-lg">Автомашины мэдээлэл (Vehicle Information)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(
                [
                  ["condition", "Нөхцөл (Condition)"],
                  ["type", "Төрөл (Type)"],
                  ["doors", "Хаалга (Door)"],
                  ["steeringWheel", "Хурд (Steering Wheel)"],
                  ["driveType", "Хөтлөгч (Drive Type)"],
                  ["yearOfManufacture", "Үйлдвэрлэсэн он (Year of Manufacture)"],
                  ["yearOfImport", "Орж ирсэн он (Year of Import)"],
                  ["engine", "Хөдөлгүүр (Engine)"],
                  ["engineCapacity", "Мотор багтаамж (Engine Capacity)"],
                  ["gearbox", "Хурдны хайрцаг (Gearbox)"],
                ] as [keyof typeof carFieldOptions, string][]
              ).map(([field, label]) => (
                <div key={field} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Select value={carFields[field]} onValueChange={(v) => setCarField(field, v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {carFieldOptions[field].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="space-y-1.5">
                <Label>Дотор өнгө (Interior Color)</Label>
                <Input placeholder="e.g., Хар, Саарал..." value={carFields.interiorColor} onChange={(e) => setCarField("interiorColor", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Явсан (Mileage)</Label>
                <div className="relative">
                  <Input placeholder="e.g., 8000" value={carFields.mileage} onChange={(e) => setCarField("mileage", e.target.value.replace(/[^0-9]/g, ""))} className="pr-12" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">KM</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Өнгө (Color)</Label>
                <Input placeholder="e.g., Цагаан, Хар..." value={carFields.color} onChange={(e) => setCarField("color", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Арлын дугаар (Chassis Number/VIN)</Label>
                <Input placeholder="e.g., JT1234567890123456" value={carFields.chassis} onChange={(e) => setCarField("chassis", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auction Settings */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="font-bold text-lg">Дуудлагын тохиргоо</h2>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Дуудлага худалдаа үргэлжлэх хугацаа (Цаг)</Label>
              <Select
                value={duration}
                onValueChange={(v) => {
                  setDuration(v ?? "");
                  if (startTime && parseInt(startTime) + Number(v) > 24) setStartTime("");
                }}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  {durations.map((d) => <SelectItem key={d} value={d}>{d} цаг</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Дуудлага худалдаа эхлэх огноо</Label>
              <Select value={startDate} onValueChange={(v) => { setStartDate(v ?? ""); setStartTime(""); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                <SelectContent>
                  {startDateOptions.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {startDate && (
                <div className="space-y-1.5 pt-1">
                  <Label>Эхлэх цаг</Label>
                  <Select value={startTime} onValueChange={(v) => setStartTime(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {hourOptions.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="font-bold text-lg">Бүтээгдэхүүний зураг</h2>
          <div>
            <Label>Зураг оруулах <span className="text-red-500">*</span></Label>
            <p className="text-xs text-blue-500 mt-0.5">Зураг сонгоод автоматаар upload хийгдэнэ</p>
          </div>
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
            <div className="flex flex-wrap gap-3">
              {imagePaths.map((path, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetUrl(path)}
                    alt={`preview-${idx}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-blue-600 text-white py-0.5">
                      Голлогч
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {imagePaths.length}/10 зураг нэмэгдсэн. Анхны зураг голлогч зураг болно.
          </p>
        </CardContent>
      </Card>

      {/* Submit feedback */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Бүтээгдэхүүн нэмж байна. Түр хүлээнэ үү...
        </div>
      )}

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/products")}>
          Цуцлах
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 gap-2"
          onClick={handleSubmit}
          disabled={submitting || submitSuccess}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Бүтээгдэхүүн нэмэх
        </Button>
      </div>
    </div>
  );
}
