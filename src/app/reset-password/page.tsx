"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Шинэ нууц үг оруулна уу.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Нууц үг таарахгүй байна. Дахин шалгана уу.");
      return;
    }
    if (!uid || !token) {
      setError("Холбоос буруу эсвэл хугацаа дууссан байна.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/seller/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uidb64: uid,
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.status_code === "ng") {
        const msg =
          typeof data?.msg === "string"
            ? data.msg
            : typeof data?.detail === "string"
            ? data.detail
            : data?.error ?? "Алдаа гарлаа. Дахин оролдоно уу.";
        setStatus("error");
        setStatusMessage(msg);
        return;
      }

      setStatus("success");
      setStatusMessage(
        typeof data?.msg === "string" ? data.msg : "Нууц үг амжилттай шинэчлэгдлээ."
      );
    } catch {
      setStatus("error");
      setStatusMessage("Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "success") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          <div className="space-y-1">
            <p className="font-bold text-xl">Амжилттай!</p>
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </div>
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => router.push("/login")}
          >
            Нэвтрэх хуудас руу орох
          </Button>
        </div>
      </div>
    );
  }

  if (!uid || !token) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
          <XCircle className="h-14 w-14 text-red-500" />
          <div className="space-y-1">
            <p className="font-bold text-xl">Холбоос хүчингүй</p>
            <p className="text-sm text-muted-foreground">
              Холбоос буруу эсвэл хугацаа дууссан байна. Дахин нууц үг сэргээх хүсэлт илгээнэ үү.
            </p>
          </div>
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => router.push("/forgot-password")}
          >
            Нууц үг сэргээх
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-white p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        {/* Key icon */}
        <div className="rounded-full bg-orange-100 p-5">
          <KeyRound className="h-8 w-8 text-orange-500" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-1">
          <h1 className="font-bold text-2xl">Шинэ нууц үг тохируулах</h1>
          <p className="text-sm text-muted-foreground">Шинэ нууц үгэе доор оруулна уу.</p>
        </div>

        {/* Form */}
        <Card className="w-full rounded-2xl shadow-sm">
          <CardContent className="px-6 pt-6 pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* New password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password" className="text-sm font-medium">Шинэ нууц үг</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10 h-11 rounded-lg"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Нууц үг давтах</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10 h-11 rounded-lg"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {(error || status === "error") && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error || statusMessage}
                </p>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-3 pt-1">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-xl text-base font-medium"
                  onClick={() => router.push("/login")}
                  disabled={loading}
                >
                  Буцах
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
