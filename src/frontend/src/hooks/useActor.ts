/**
 * useActor.ts — Thin wrapper around the core-infrastructure useActor hook.
 * Returns { actor: BackendActor | null, isFetching: boolean }.
 *
 * The BackendActor type is defined here (not in backend.d.ts) because bindgen
 * produces an empty _SERVICE when the backend candid hasn't been regenerated yet.
 */
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

export type BackendActor = ReturnType<typeof createActor>;

export function useActor() {
  return _useActor(createActor);
}
