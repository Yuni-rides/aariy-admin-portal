"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "../auth.store";
import { toast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import Image from "next/image";
import { requestForToken } from "@/lib/firebase";
import { AUTH_BYPASS } from "../auth.mock";

const ALLOWED_ROLES = ["OWNER", "SUPER_ADMIN"];

export default function Login() {
  const router = useRouter();
  const { login, loading, error } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    const fcmToken = AUTH_BYPASS ? null : await requestForToken();

    const response = await login({
      email,
      password,
      fcmToken: fcmToken || undefined,
    });

    if (response.success) {
      const roleCode = useAuthStore.getState().user?.role;

      if (!roleCode || !ALLOWED_ROLES.includes(roleCode)) {
        Cookies.remove("token");
        localStorage.removeItem("auth-storage");
        useAuthStore.setState({ user: null, accessToken: null });

        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email or password.",
        });
        return;
      }

      toast({
        title: "Login successful",
        description: response.message,
      });
      router.push("/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: response.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="pt-10 pb-10 px-8 flex flex-col items-center">
          <div className="mb-6">
            <Image
              src="/logo.png"
              alt="Logo"
              width={140}
              height={40}
              priority
              className="object-contain"
            />
          </div>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm">
              Please log in to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input
                id="email"
                placeholder="Enter your email"
                className="h-11 bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="h-11 bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {AUTH_BYPASS && (
              <p className="rounded-md bg-accent px-3 py-2 text-center text-xs text-muted-foreground">
                Test mode: any email and password will log you in.
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-medium mt-2 bg-primary hover:bg-primary/90 cursor-pointer"
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
