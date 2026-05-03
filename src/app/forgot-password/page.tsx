"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const uidb64 = searchParams.get("uidb64");
  const token = searchParams.get("token");

  // ── Email request step ──
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // ── Token verification step ──
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "success" | "error">("idle");
  const [verifyMessage, setVerifyMessage] = useState("");

  // Verify token on mount if params are present
  useEffect(() => {
    if (!uidb64 || !token) return;

    setVerifying(true);
    fetch(`/api/v1/user/email/verify?uidb64=${encodeURIComponent(uidb64)}&token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data?.status_code !== "ng") {
          setVerifyStatus("success");
          setVerifyMessage(
            typeof data?.msg === "string"
              ? data.msg
              : "Хэрэглэгч амжилттай баталгаажлаа."
          );
        } else {
          setVerifyStatus("error");
          setVerifyMessage(
            typeof data?.msg === "string"
              ? data.msg
              : typeof data?.detail === "string"
              ? data.detail
              : "Токен буруу эсвэл хугацаа дууссан байна."
          );
        }
      })
      .catch(() => {
        setVerifyStatus("error");
        setVerifyMessage("Сервертэй холбогдоход алдаа гарлаа.");
      })
      .finally(() => setVerifying(false));
  }, [uidb64, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Имэйл хаяг оруулна уу.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/seller/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok && data?.status_code !== "ok") {
        const msg =
          typeof data?.msg === "string"
            ? data.msg
            : typeof data?.detail === "string"
            ? data.detail
            : data?.error ?? "Алдаа гарлаа. Дахин оролдоно уу.";
        setError(msg);
        return;
      }

      setEmailSent(true);
    } catch {
      setError("Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 self-center">
          <Image src="/svg/main-logo.svg" alt="Logo" width={180} height={48} priority />
        </a>

        {/* ── Token verification view ── */}
        {(uidb64 && token) ? (
          <Card>
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
              {verifying ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">Баталгаажуулж байна...</p>
                </>
              ) : verifyStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  <div className="space-y-1">
                    <p className="font-semibold text-base">Амжилттай!</p>
                    <p className="text-sm text-muted-foreground">{verifyMessage}</p>
                  </div>
                  <Button
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => router.push("/login")}
                  >
                    Нэвтрэх хуудас руу буцах
                  </Button>
                </>
              ) : verifyStatus === "error" ? (
                <>
                  <XCircle className="h-12 w-12 text-red-500" />
                  <div className="space-y-1">
                    <p className="font-semibold text-base">Баталгаажуулалт амжилтгүй</p>
                    <p className="text-sm text-muted-foreground">{verifyMessage}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => router.push("/forgot-password")}
                  >
                    Дахин оролдох
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        ) : emailSent ? (
          /* ── Email sent success view ── */
          <Card>
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-950/40 p-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-base">Имэйл илгээлээ</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{email}</span> хаяг руу нууц үг
                  сэргээх холбоос илгээлээ. Имэйлээ шалгана уу.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Имэйл ирэхгүй бол спам хавтсаа шалгана уу.
              </p>
              <Button
                variant="outline"
                className="w-full mt-1"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                Өөр имэйлээр оролдох
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ── Email request form ── */
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Нууц үг мартсан</CardTitle>
              <CardDescription>
                Бүртгэлтэй имэйл хаягаа оруулна уу. Нууц үг сэргээх холбоос илгээнэ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Имэйл хаяг</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@auction.mn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Илгээж байна..." : "Холбоос илгээх"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground"
                    onClick={() => router.push("/login")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Нэвтрэх хуудас руу буцах
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-muted/40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
