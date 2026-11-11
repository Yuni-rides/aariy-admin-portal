"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, LogOut, Mail, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/hooks/useToast";
import { requestForToken } from "@/lib/firebase";
import { useAuthStore } from "@/features/auth/auth.store";
import { AUTH_BYPASS } from "@/features/auth/auth.mock";
import { useUserStore } from "../user.store";
import { UpdateProfileDto } from "../user.types";
import {
  getInitials,
  getRoleLabel,
  validateNewPassword,
} from "../user.helpers";

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";
const inputClass = "h-11 rounded-[10px] bg-white";

type PasswordForm = { current: string; next: string; confirm: string };
const EMPTY_PASSWORDS: PasswordForm = { current: "", next: "", confirm: "" };

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { saving, changingPassword, updateProfile, changePassword } = useUserStore();

  const [profile, setProfile] = useState<UpdateProfileDto>({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof UpdateProfileDto, string>>>({});

  const [passwords, setPasswords] = useState<PasswordForm>(EMPTY_PASSWORDS);
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordForm>>({});
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user]);

  const profileDirty =
    !!user &&
    (profile.firstName !== (user.firstName ?? "") ||
      profile.lastName !== (user.lastName ?? "") ||
      (profile.phone ?? "") !== (user.phone ?? ""));

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof profileErrors = {};
    if (!profile.firstName.trim()) errors.firstName = "First name is required";
    if (!profile.lastName.trim()) errors.lastName = "Last name is required";
    if (profile.phone && !/^\+?[\d\s-]{7,15}$/.test(profile.phone))
      errors.phone = "Enter a valid phone number";
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;

    const res = await updateProfile({
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      phone: profile.phone?.trim() || null,
    });
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Couldn't save", description: res.message },
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Partial<PasswordForm> = {};
    if (!passwords.current) errors.current = "Enter your current password";
    const nextError = validateNewPassword(passwords.next);
    if (nextError) errors.next = nextError;
    else if (passwords.next === passwords.current)
      errors.next = "New password must be different";
    if (passwords.confirm !== passwords.next) errors.confirm = "Passwords don't match";
    setPasswordErrors(errors);
    if (Object.keys(errors).length) return;

    const res = await changePassword({
      currentPassword: passwords.current,
      newPassword: passwords.next,
    });
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Couldn't change password", description: res.message },
    );
    if (res.success) setPasswords(EMPTY_PASSWORDS);
  };

  const handleLogout = async () => {
    const token = AUTH_BYPASS ? null : await requestForToken();
    await logout(token || "");
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        {/* Summary */}
        <Card className="flex flex-col gap-4 rounded-2xl p-[18px] shadow-none">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent text-xl font-semibold">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{fullName || "—"}</h2>
              <StatusBadge tone="info" className="mt-1">
                {getRoleLabel(user?.role)}
              </StatusBadge>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 border-t pt-4 text-sm">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{user?.phone || "No phone added"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Super admin portal access</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={handleLogout}
          >
            <LogOut /> Log out
          </Button>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Personal details */}
          <Card className="rounded-2xl p-[18px] shadow-none">
            <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold">Personal details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pf-first" className={labelClass}>First name</Label>
                  <Input
                    id="pf-first"
                    className={inputClass}
                    value={profile.firstName}
                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  />
                  {profileErrors.firstName && <p className="mt-1 text-xs text-destructive">{profileErrors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="pf-last" className={labelClass}>Last name</Label>
                  <Input
                    id="pf-last"
                    className={inputClass}
                    value={profile.lastName}
                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  />
                  {profileErrors.lastName && <p className="mt-1 text-xs text-destructive">{profileErrors.lastName}</p>}
                </div>
                <div>
                  <Label htmlFor="pf-email" className={labelClass}>Email</Label>
                  <Input id="pf-email" className={inputClass} value={user?.email ?? ""} disabled />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ask another super admin to change your login email.
                  </p>
                </div>
                <div>
                  <Label htmlFor="pf-phone" className={labelClass}>Phone (optional)</Label>
                  <Input
                    id="pf-phone"
                    className={inputClass}
                    placeholder="+92 300 1234567"
                    value={profile.phone ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  />
                  {profileErrors.phone && <p className="mt-1 text-xs text-destructive">{profileErrors.phone}</p>}
                </div>
              </div>
              <div>
                <Button
                  type="submit"
                  disabled={saving || !profileDirty}
                  className="min-h-11 cursor-pointer rounded-[10px]"
                >
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Password */}
          <Card className="rounded-2xl p-[18px] shadow-none">
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold">Change password</h2>
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords((v) => !v)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPasswords ? "Hide" : "Show"} passwords
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ["current", "Current password", "current-password"],
                    ["next", "New password", "new-password"],
                    ["confirm", "Confirm new password", "new-password"],
                  ] as const
                ).map(([key, label, autoComplete]) => (
                  <div key={key}>
                    <Label htmlFor={`pw-${key}`} className={labelClass}>{label}</Label>
                    <Input
                      id={`pw-${key}`}
                      type={showPasswords ? "text" : "password"}
                      autoComplete={autoComplete}
                      className={inputClass}
                      value={passwords[key]}
                      onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                    />
                    {passwordErrors[key] && <p className="mt-1 text-xs text-destructive">{passwordErrors[key]}</p>}
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-muted-foreground">
                At least 8 characters, with letters and numbers.
              </p>
              <div>
                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="min-h-11 cursor-pointer rounded-[10px]"
                >
                  {changingPassword ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
