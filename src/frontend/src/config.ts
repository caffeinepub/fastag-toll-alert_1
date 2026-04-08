/**
 * config.ts — Re-exports createActorWithConfig from the core-infrastructure package.
 * This file must exist for all mutation hooks that call createActorWithConfig directly.
 */
export { createActorWithConfig, loadConfig } from "@caffeineai/core-infrastructure";
