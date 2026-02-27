import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { TollPlaza, Transaction, BalanceEvent } from "../backend.d.ts";
import { createActorWithConfig } from "../config";

/** No-op kept for backward compatibility -- App.tsx imports this. */
export function useActorSync() {}

/** No-op kept for backward compatibility -- App.tsx imports this. */
export function useActorRegistry() {}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["balance"],
    queryFn: async () => {
      if (!actor) return 0;
      const bal = await actor.getBalance();
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
      return actor.getVehicleType();
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
      return actor.getAllTollPlazas();
    },
    enabled: !!actor && !isFetching,
    staleTime: Infinity,
  });
}

export function useTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactions();
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
      return actor.getBalanceHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// Each mutation creates a fresh actor connection directly -- no refs, no
// shared state, no useEffect timing issues. This guarantees the backend
// call always goes through on the very first tap.
// ---------------------------------------------------------------------------

export function useSetVehicleType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleType: string) => {
      const a = await createActorWithConfig();
      await a.setVehicleType(vehicleType);
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
      const a = await createActorWithConfig();
      await a.setBalance(BigInt(Math.round(amount)));
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
      const a = await createActorWithConfig();
      const newBal = await a.recharge(BigInt(Math.round(amount)));
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
      const a = await createActorWithConfig();
      return a.deductToll(plazaId, vehicleType);
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
      const a = await createActorWithConfig();
      await a.addTollPlaza(plaza);
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
      const a = await createActorWithConfig();
      await a.clearTransactions();
    },
    onSuccess: () => {
      qc.setQueryData(["transactions"], []);
    },
  });
}

export type { TollPlaza, Transaction, BalanceEvent };
