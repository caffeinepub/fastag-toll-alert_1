import React, { useState } from "react";
import { toast } from "sonner";
import { Zap, CreditCard, IndianRupee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBalance, useRecharge, useSetBalance } from "../hooks/useQueries";

const QUICK_AMOUNTS = [200, 500, 1000, 2000];

export function RechargeTab() {
  const { data: balance = 0 } = useBalance();
  const rechargeMut = useRecharge();
  const setBalanceMut = useSetBalance();

  const [amount, setAmount] = useState("");
  const [setMode, setSetMode] = useState(false);

  const handleRecharge = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      const newBal = await rechargeMut.mutateAsync(val);
      toast.success(`Recharged ₹${val.toLocaleString("en-IN")}. New balance: ₹${newBal.toLocaleString("en-IN")}`);
      setAmount("");
    } catch (err) {
      console.error("Recharge error:", err);
      toast.error("Recharge failed. Please try again.");
    }
  };

  const handleSetBalance = async () => {
    const val = parseFloat(amount);
    if (val === undefined || isNaN(val) || val < 0) {
      toast.error("Enter a valid balance");
      return;
    }
    try {
      await setBalanceMut.mutateAsync(val);
      toast.success(`Balance updated to ₹${val.toLocaleString("en-IN")}`);
      setAmount("");
    } catch (err) {
      console.error("Set balance error:", err);
      toast.error("Failed to update balance. Please try again.");
    }
  };

  // Only block button during active mutation -- actor connection is handled internally
  const isPending = rechargeMut.isPending || setBalanceMut.isPending;

  const balanceColor =
    balance > 500
      ? "oklch(0.72 0.2 145)"
      : balance > 100
      ? "oklch(0.78 0.18 75)"
      : "oklch(0.65 0.24 25)";

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Current Balance */}
      <div className="card-glass rounded-xl p-5 border-glow-cyan text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase">
            Current Balance
          </span>
        </div>
        <div
          className="font-mono-jb text-6xl font-bold"
          style={{
            color: `oklch(var(--foreground))`,
            textShadow: `0 0 20px ${balanceColor}`,
          }}
        >
          ₹{balance.toLocaleString("en-IN")}
        </div>
        <div
          className="mt-3 text-sm"
          style={{ color: balance < 100 ? "oklch(0.65 0.24 25)" : "oklch(0.5 0.02 240)" }}
        >
          {balance < 100
            ? "⚠ Balance critically low — recharge now"
            : balance < 500
            ? "Balance getting low"
            : "Balance is sufficient"}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="card-glass rounded-xl p-1 flex border border-border/50">
        <button
          type="button"
          onClick={() => setSetMode(false)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-rajdhani font-semibold tracking-wide transition-all ${
            !setMode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="w-4 h-4 inline mr-1.5" />
          Recharge
        </button>
        <button
          type="button"
          onClick={() => setSetMode(true)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-rajdhani font-semibold tracking-wide transition-all ${
            setMode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <IndianRupee className="w-4 h-4 inline mr-1.5" />
          Set Balance
        </button>
      </div>

      {/* Amount Input */}
      <div className="card-glass rounded-xl p-4 border border-border/50">
        <Label className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase block mb-3">
          {setMode ? "Set FASTag Balance (₹)" : "Recharge Amount (₹)"}
        </Label>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono-jb text-lg">
            ₹
          </span>
          <Input
            type="number"
            min="0"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 font-mono-jb text-xl h-14 bg-secondary/50 border-border/60 text-foreground placeholder:text-muted-foreground/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (setMode) {
                  void handleSetBalance();
                } else {
                  void handleRecharge();
                }
              }
            }}
          />
        </div>

        {/* Quick amounts — only for recharge */}
        {!setMode && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                type="button"
                key={qa}
                onClick={() => setAmount(String(qa))}
                className={`py-2 rounded-lg text-sm font-mono-jb font-semibold transition-all border ${
                  amount === String(qa)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/40 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                ₹{qa}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={setMode ? handleSetBalance : handleRecharge}
          disabled={isPending || !amount}
          className="mt-4 w-full h-12 font-rajdhani text-base font-bold tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {setMode ? "Updating..." : "Recharging..."}
            </>
          ) : setMode ? (
            <>
              <IndianRupee className="w-5 h-5 mr-2" />
              SET BALANCE
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              RECHARGE NOW
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="card-glass rounded-xl p-4 border border-border/30">
        <div className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase mb-3">
          How it works
        </div>
        <ul className="space-y-2">
          {[
            { id: "tip1", text: "Recharge adds amount to your current balance" },
            { id: "tip2", text: "Set Balance updates your balance to exact amount (after bank recharge)" },
            { id: "tip3", text: "Balance auto-deducted when crossing toll plazas" },
            { id: "tip4", text: "Beep alert activates within 5km if balance is low" },
          ].map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">›</span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
