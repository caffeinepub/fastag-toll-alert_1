import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useActor } from "./useActor";
import type { TollPlaza, Transaction, BalanceEvent } from "../backend.d.ts";
import { createActorWithConfig } from "../config";
import type { backendInterface } from "../backend";

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
// Helper: get actor from a ref, or fall back to creating a fresh one.
// Using a ref means the mutation closure always captures the latest value
// without needing to query the React Query cache.
// ---------------------------------------------------------------------------

async function getActor(
  actorRef: React.MutableRefObject<backendInterface | null>
): Promise<backendInterface> {
  if (actorRef.current) return actorRef.current;
  // Last resort: create a fresh actor (config is cached after first load)
  const a = await createActorWithConfig();
  actorRef.current = a;
  return a;
}

// ---------------------------------------------------------------------------
// Mutation hooks -- each uses useActor() so they share the same actor ref
// that the query hooks use. The actor is stored in a ref so mutations can
// access it inside closures without stale captures.
// ---------------------------------------------------------------------------

export function useSetVehicleType() {
  const { actor } = useActor();
  const actorRef = useRef<backendInterface | null>(actor);
  actorRef.current = actor;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleType: string) => {
      const a = await getActor(actorRef);
      await a.setVehicleType(vehicleType);
      return vehicleType;
    },
    onSuccess: (vehicleType) => {
      qc.setQueryData(["vehicleType"], vehicleType);
    },
  });
}

export function useSetBalance() {
  const { actor } = useActor();
  const actorRef = useRef<backendInterface | null>(actor);
  actorRef.current = actor;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const a = await getActor(actorRef);
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
  const { actor } = useActor();
  const actorRef = useRef<backendInterface | null>(actor);
  actorRef.current = actor;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const a = await getActor(actorRef);
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
  const { actor } = useActor();
  const actorRef = useRef<backendInterface | null>(actor);
  actorRef.current = actor;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plazaId,
      vehicleType,
    }: {
      plazaId: string;
      vehicleType: string;
    }) => {
      const a = await getActor(actorRef);
      return a.deductToll(plazaId, vehicleType);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["balance"] });
      void qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useAddTollPlaza() {
  const { actor } = useActor();
  const actorRef = useRef<backendInterface | null>(actor);
  actorRef.current = actor;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plaza: TollPlaza) => {
      const a = await getActor(actorRef);
      await a.addTollPlaza(plaza);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tollPlazas"] });
    },
  });
}

export function useClearTransactions() {
  const { actor } = useActor();
  const actorRef = useRef<backendInterface | null>(actor);
  actorRef.current = actor;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const a = await getActor(actorRef);
      await a.clearTransactions();
    },
    onSuccess: () => {
      qc.setQueryData(["transactions"], []);
    },
  });
}

export type { TollPlaza, Transaction, BalanceEvent };
