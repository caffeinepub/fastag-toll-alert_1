import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Loader2, MapPin, Receipt, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useClearTransactions, useTransactions } from "../hooks/useQueries";

function formatTimestamp(ts: bigint): string {
  // Backend timestamp is in nanoseconds (ICP Time.now())
  const ms = Number(ts / BigInt(1_000_000));
  const d = new Date(ms);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryTab() {
  const { data: transactions = [], isLoading } = useTransactions();
  const clearMut = useClearTransactions();

  const handleClear = async () => {
    try {
      await clearMut.mutateAsync();
      toast.success("Transaction history cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  // Sort newest first
  const sorted = [...transactions].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  const totalSpent = sorted.reduce(
    (sum, t) => sum + Number(t.amountDeducted),
    0,
  );

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Summary */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card-glass rounded-xl p-3 border border-border/50 text-center">
            <div className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase mb-1">
              Transactions
            </div>
            <div className="font-mono-jb text-3xl font-bold text-primary glow-cyan">
              {sorted.length}
            </div>
          </div>
          <div className="card-glass rounded-xl p-3 border border-border/50 text-center">
            <div className="text-xs font-rajdhani tracking-widest text-muted-foreground uppercase mb-1">
              Total Spent
            </div>
            <div className="font-mono-jb text-3xl font-bold text-destructive">
              ₹{totalSpent.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          <span className="font-rajdhani font-semibold tracking-wide text-sm">
            Transaction History
          </span>
        </div>
        {sorted.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={clearMut.isPending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs font-rajdhani"
          >
            {clearMut.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Clear All
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="card-glass rounded-xl p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <div className="card-glass rounded-xl p-10 flex flex-col items-center gap-3 border border-dashed border-border/40">
          <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center">
            <Receipt className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <div className="font-rajdhani font-semibold text-base text-foreground">
              No transactions yet
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tolls will appear here after crossing a plaza
            </div>
          </div>
        </div>
      )}

      {/* Transaction list */}
      {!isLoading && sorted.length > 0 && (
        <ScrollArea className="max-h-[520px]">
          <div className="flex flex-col gap-2 pr-1">
            {sorted.map((tx) => (
              <div
                key={`${tx.plazaId}-${tx.timestamp.toString()}`}
                className="card-glass rounded-xl p-4 border border-border/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {tx.plazaName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 border-primary/30 text-primary font-mono-jb"
                        >
                          {tx.vehicleType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-jb font-bold text-lg text-destructive">
                      -₹{Number(tx.amountDeducted).toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono-jb">
                      Bal: ₹{Number(tx.balanceAfter).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(tx.timestamp)}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono-jb">
                    Before: ₹{Number(tx.balanceBefore).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
