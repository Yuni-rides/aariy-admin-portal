

const DOT = "•";

export function maskDigits(value: string, keep = 4): string {
  if (!value) return "";
  const total = value.replace(/\D/g, "").length;
  let seen = 0;
  return value.replace(/\d/g, (d) => (++seen > total - keep ? d : DOT));
}

export function maskPhone(value: string): string {
  if (!value) return "";
  const m = value.trim().match(/^(\+\d{1,3})(.*)$/);
  return m ? `${m[1]}${maskDigits(m[2], 4)}` : maskDigits(value, 4);
}

export function maskEmail(value: string): string {
  if (!value) return "";
  const at = value.indexOf("@");
  if (at < 1) return DOT.repeat(3);
  const name = value.slice(0, at);
  return `${name.slice(0, Math.min(2, name.length - 1))}${DOT.repeat(3)}${value.slice(at)}`;
}

export function maskAccount(value: string): string {
  if (!value) return "";
  const v = value.replace(/\s/g, "");
  return v.length <= 8 ? maskDigits(v, 4) : `${v.slice(0, 4)} ${DOT.repeat(4)} ${v.slice(-4)}`;
}

export type SensitiveKind = "phone" | "email" | "id" | "account";

export const maskValue = (value: string, kind: SensitiveKind) =>
  kind === "phone"
    ? maskPhone(value)
    : kind === "email"
      ? maskEmail(value)
      : kind === "account"
        ? maskAccount(value)
        : maskDigits(value, 4);
