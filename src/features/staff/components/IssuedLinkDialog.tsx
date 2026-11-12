"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { IssuedLink } from "../staff.types";
import { LINK_TTL_HOURS, formatExpiry } from "../staff.helpers";

type IssuedLinkDialogProps = {
  link: IssuedLink | null;
  onClose: () => void;
};

/** Shows a one-time setup / reset link once, with a copy button. */
export function IssuedLinkDialog({ link, onClose }: IssuedLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [link]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the field is selectable as a fallback.
      (document.getElementById("issued-link") as HTMLInputElement | null)?.select();
    }
  };

  return (
    <Modal open={!!link} onClose={onClose} className="h-auto max-w-lg">
      {link && (
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
          <div>
            <h2 className="text-lg font-semibold">
              {link.kind === "SETUP" ? "Setup link created" : "Password reset link created"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send this to {link.staffName} ({link.email}) only.{" "}
              {link.kind === "SETUP"
                ? "They use it to set a password and turn on sign-in."
                : "They use it to choose a new password."}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="issued-link"
              readOnly
              className="h-11 rounded-[10px] bg-muted font-mono text-xs"
              value={link.url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Link"
            />
            <Button className="min-h-11 shrink-0 cursor-pointer rounded-[10px]" onClick={copy}>
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Works once and expires in {LINK_TTL_HOURS} hours ({formatExpiry(link.expiresAt)}). Any older link for
            this person stops working. Every link is logged.
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" className="min-h-11 cursor-pointer rounded-[10px]" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
