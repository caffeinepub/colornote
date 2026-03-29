import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { T } from "../i18n";
import { hashPin } from "../utils";

interface PinLockDialogProps {
  open: boolean;
  mode: "verify" | "set";
  storedHash?: string;
  t: T;
  onVerified: (pin: string) => void;
  onCancel: () => void;
}

export default function PinLockDialog({
  open,
  mode,
  storedHash,
  t,
  onVerified,
  onCancel,
}: PinLockDialogProps) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (mode === "verify") {
      if (hashPin(pin) === storedHash) {
        setPin("");
        setError("");
        onVerified(pin);
      } else {
        setError(t.wrongPin);
      }
    } else {
      if (pin.length !== 4) {
        setError("PIN must be 4 digits");
        return;
      }
      if (pin !== confirm) {
        setError(t.pinMismatch);
        return;
      }
      setPin("");
      setConfirm("");
      setError("");
      onVerified(pin);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm" data-ocid="pin_lock.dialog">
        <DialogHeader>
          <DialogTitle>
            {mode === "verify" ? t.pinRequired : t.setPinTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>{t.enterPin}</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="••••"
              className="mt-1 text-center text-2xl tracking-widest"
              data-ocid="pin_lock.input"
            />
          </div>
          {mode === "set" && (
            <div>
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="••••"
                className="mt-1 text-center text-2xl tracking-widest"
                data-ocid="pin_lock.confirm_input"
              />
            </div>
          )}
          {error && (
            <p
              className="text-destructive text-sm"
              data-ocid="pin_lock.error_state"
            >
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            data-ocid="pin_lock.cancel_button"
          >
            {t.cancel}
          </Button>
          <Button onClick={handleSubmit} data-ocid="pin_lock.confirm_button">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
