import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TollRates {
    lcv: bigint;
    mav: bigint;
    oversized: bigint;
    multiAxle: bigint;
    busTruck: bigint;
    carJeepVan: bigint;
}
export interface BalanceEvent {
    timestamp: bigint;
    amount: bigint;
}
export interface TollPlaza {
    id: string;
    latitude: number;
    name: string;
    highway: string;
    tollRates: TollRates;
    longitude: number;
}
export interface Transaction {
    plazaName: string;
    vehicleType: string;
    amountDeducted: bigint;
    plazaId: string;
    timestamp: bigint;
    balanceAfter: bigint;
    balanceBefore: bigint;
}
export interface backendInterface {
    addTollPlaza(plaza: TollPlaza): Promise<void>;
    clearTransactions(): Promise<void>;
    deductToll(plazaId: string, vehicleType: string): Promise<boolean>;
    getAllTollPlazas(): Promise<Array<TollPlaza>>;
    getBalance(): Promise<bigint>;
    getBalanceHistory(): Promise<Array<BalanceEvent>>;
    getTollPlaza(id: string): Promise<TollPlaza>;
    getTransactions(): Promise<Array<Transaction>>;
    getVehicleType(): Promise<string>;
    recharge(amount: bigint): Promise<bigint>;
    setBalance(newBalance: bigint): Promise<void>;
    setVehicleType(newVehicleType: string): Promise<void>;
}
