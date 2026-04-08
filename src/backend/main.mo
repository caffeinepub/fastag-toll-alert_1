import List "mo:core/List";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Order "mo:core/Order";




actor {
  public type TollRates = {
    carJeepVan : Nat;
    lcv : Nat;
    busTruck : Nat;
    multiAxle : Nat;
    mav : Nat;
    oversized : Nat;
  };

  public type TollPlaza = {
    id : Text;
    name : Text;
    highway : Text;
    latitude : Float;
    longitude : Float;
    tollRates : TollRates;
  };

  type Transaction = {
    plazaId : Text;
    plazaName : Text;
    vehicleType : Text;
    amountDeducted : Nat;
    balanceBefore : Nat;
    balanceAfter : Nat;
    timestamp : Int;
  };

  type BalanceEvent = {
    timestamp : Int;
    amount : Nat;
  };

  var balance : Nat = 0;
  var vehicleType : Text = "Car/Jeep/Van";
  var pTollPlazas = Map.empty<Text, TollPlaza>();
  var pTransactionHistory = List.empty<Transaction>();
  var pBalanceHistory = List.empty<BalanceEvent>();

  // Legacy stable variable names — kept for upgrade compatibility with old snapshots.
  // These match what was stored in previous versions and must not be removed.
  var tollPlazas = Map.empty<Text, TollPlaza>();
  var transactionHistory = List.empty<Transaction>();
  var balanceHistory = List.empty<BalanceEvent>();

  let vehicleTypes = [
    "Car/Jeep/Van",
    "LCV",
    "Bus/Truck",
    "Multi-Axle",
    "MAV",
    "Oversized",
  ];

  // Prepopulate with Pallikonda Toll Plaza
  let pallikondaPlaza : TollPlaza = {
    id = "NH-46-001";
    name = "Pallikonda Toll Plaza";
    highway = "NH-46";
    latitude = 12.7904;
    longitude = 78.9247;
    tollRates = {
      carJeepVan = 85;
      lcv = 140;
      busTruck = 285;
      multiAxle = 450;
      mav = 545;
      oversized = 545;
    };
  };

  // Initialize persistent map with prepopulated value if empty
  if (pTollPlazas.isEmpty()) {
    pTollPlazas.add(pallikondaPlaza.id, pallikondaPlaza);
  };

  public shared ({ caller }) func setBalance(newBalance : Nat) : async () {
    balance := newBalance;
  };

  public shared ({ caller }) func setVehicleType(newVehicleType : Text) : async () {
    let isValid = vehicleTypes.any(func(vt) { vt == newVehicleType });
    if (not isValid) {
      Runtime.trap("Invalid vehicle type");
    };
    vehicleType := newVehicleType;
  };

  public query ({ caller }) func getBalance() : async Nat {
    balance;
  };

  public query ({ caller }) func getVehicleType() : async Text {
    vehicleType;
  };

  public query ({ caller }) func getAllTollPlazas() : async [TollPlaza] {
    pTollPlazas.values().toArray();
  };

  public query ({ caller }) func getTollPlaza(id : Text) : async TollPlaza {
    switch (pTollPlazas.get(id)) {
      case (null) { Runtime.trap("Toll plaza not found") };
      case (?plaza) { plaza };
    };
  };

  public shared ({ caller }) func addTollPlaza(plaza : TollPlaza) : async () {
    pTollPlazas.add(plaza.id, plaza);
  };

  public query ({ caller }) func getTransactions() : async [Transaction] {
    pTransactionHistory.toArray();
  };

  public shared ({ caller }) func clearTransactions() : async () {
    pTransactionHistory.clear();
  };

  public shared ({ caller }) func recharge(amount : Nat) : async Nat {
    balance += amount;
    let event : BalanceEvent = {
      timestamp = Time.now();
      amount;
    };
    pBalanceHistory.add(event);
    balance;
  };

  public shared ({ caller }) func deductToll(plazaId : Text, vehicleType : Text) : async Bool {
    switch (pTollPlazas.get(plazaId)) {
      case (null) { Runtime.trap("Toll plaza not found") };
      case (?plaza) {
        let rate = switch (vehicleType) {
          case ("Car/Jeep/Van") { plaza.tollRates.carJeepVan };
          case ("LCV") { plaza.tollRates.lcv };
          case ("Bus/Truck") { plaza.tollRates.busTruck };
          case ("Multi-Axle") { plaza.tollRates.multiAxle };
          case ("MAV") { plaza.tollRates.mav };
          case ("Oversized") { plaza.tollRates.oversized };
          case (_) { Runtime.trap("Invalid vehicle type") };
        };

        if (balance < rate) {
          return false;
        };

        let transaction : Transaction = {
          plazaId;
          plazaName = plaza.name;
          vehicleType;
          amountDeducted = rate;
          balanceBefore = balance;
          balanceAfter = balance - rate;
          timestamp = Time.now();
        };

        balance -= rate;
        pTransactionHistory.add(transaction);

        true;
      };
    };
  };

  public query ({ caller }) func getBalanceHistory() : async [BalanceEvent] {
    pBalanceHistory.toArray().sort(func(a : BalanceEvent, b : BalanceEvent) : Order.Order { Int.compare(b.timestamp, a.timestamp) });
  };
};
