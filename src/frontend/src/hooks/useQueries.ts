import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import { createActorWithConfig } from "../config";
import { useActor } from "./useActor";

/** No-op kept for backward compatibility -- App.tsx imports this. */
export function useActorSync() {}

/** No-op kept for backward compatibility -- App.tsx imports this. */
export function useActorRegistry() {}

// ---------------------------------------------------------------------------
// Local type definitions matching the Motoko backend types.
// (backend.d.ts is empty because bindgen runs against candid, not source.)
// ---------------------------------------------------------------------------

export interface TollRates {
  carJeepVan: bigint;
  lcv: bigint;
  busTruck: bigint;
  multiAxle: bigint;
  mav: bigint;
  oversized: bigint;
}

export interface TollPlaza {
  id: string;
  name: string;
  highway: string;
  latitude: number;
  longitude: number;
  tollRates: TollRates;
}

export interface Transaction {
  plazaId: string;
  plazaName: string;
  vehicleType: string;
  amountDeducted: bigint;
  balanceBefore: bigint;
  balanceAfter: bigint;
  timestamp: bigint;
}

export interface BalanceEvent {
  timestamp: bigint;
  amount: bigint;
}

// ---------------------------------------------------------------------------
// Helper: create a fresh actor on demand for mutations.
// Called directly at tap time — no refs, no shared state, no polling.
// ---------------------------------------------------------------------------

async function getFreshActor() {
  return createActorWithConfig(createActor);
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["balance"],
    queryFn: async () => {
      if (!actor) return 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bal = await (actor as any).getBalance();
      return Number(bal);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useVehicleType() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["vehicleType"],
    queryFn: async () => {
      if (!actor) return "Car/Jeep/Van";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getVehicleType();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTollPlazas() {
  const { actor, isFetching } = useActor();
  return useQuery<TollPlaza[]>({
    queryKey: ["tollPlazas"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllTollPlazas();
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBalanceHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<BalanceEvent[]>({
    queryKey: ["balanceHistory"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getBalanceHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks — each creates a fresh actor at tap time via createActorWithConfig.
// This is the only reliable pattern: no refs, no useEffect, no polling.
// ---------------------------------------------------------------------------

export function useSetVehicleType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleType: string) => {
      const a = await getFreshActor();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (a as any).setVehicleType(vehicleType);
      return vehicleType;
    },
    onSuccess: (vehicleType) => {
      qc.setQueryData(["vehicleType"], vehicleType);
    },
  });
}

export function useSetBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const a = await getFreshActor();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (a as any).setBalance(BigInt(Math.round(amount)));
      return amount;
    },
    onSuccess: (amount) => {
      qc.setQueryData(["balance"], amount);
      void qc.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useRecharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const a = await getFreshActor();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newBal = await (a as any).recharge(BigInt(Math.round(amount)));
      return Number(newBal);
    },
    onSuccess: (newBal) => {
      qc.setQueryData(["balance"], newBal);
      void qc.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useDeductToll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plazaId,
      vehicleType,
    }: {
      plazaId: string;
      vehicleType: string;
    }) => {
      const a = await getFreshActor();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (a as any).deductToll(plazaId, vehicleType);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["balance"] });
      void qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useAddTollPlaza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plaza: TollPlaza) => {
      const a = await getFreshActor();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (a as any).addTollPlaza(plaza);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tollPlazas"] });
    },
  });
}

export function useClearTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const a = await getFreshActor();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (a as any).clearTransactions();
    },
    onSuccess: () => {
      qc.setQueryData(["transactions"], []);
    },
  });
}
