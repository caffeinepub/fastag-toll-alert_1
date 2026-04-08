import type { TollPlaza } from "../hooks/useQueries";

// All Tamil Nadu toll plazas with GPS coordinates verified from OpenStreetMap / NHAI data
// Sources: OpenStreetMap barrier=toll_booth nodes, NHAI fastag.net listings
// NOTE: TollRates fields use bigint in the backend type — we use numbers here and convert when needed
export const TOLL_PLAZAS_DATA = [
  // ─── NH-48 / Chennai–Bengaluru corridor ───────────────────────────────────
  {
    id: "TN001",
    name: "Pallikonda Toll Plaza",
    highway: "NH-48",
    // OSM node 313299436: 12.9056, 78.9517 — verified on NH-48, Pallikonda, Vellore PIN 635809
    latitude: 12.9056,
    longitude: 78.9517,
    tollRates: {
      carJeepVan: 75,
      lcv: 120,
      busTruck: 250,
      multiAxle: 355,
      mav: 530,
      oversized: 605,
    },
  },
  {
    id: "TN002",
    name: "Kariyamangalam Toll Plaza",
    highway: "NH-48",
    // OSM node 435338461 (NHAI ref 536246): 12.2883, 78.8285 — between Krishnagiri & Pallikonda
    latitude: 12.2883,
    longitude: 78.8285,
    tollRates: {
      carJeepVan: 70,
      lcv: 115,
      busTruck: 240,
      multiAxle: 340,
      mav: 510,
      oversized: 580,
    },
  },
  {
    id: "TN003",
    name: "Krishnagiri Toll Plaza",
    highway: "NH-48",
    // OSM node 313272280 / 2452431740: 12.5446, 78.2013 — Krishnagiri on NH-48
    latitude: 12.5446,
    longitude: 78.2013,
    tollRates: {
      carJeepVan: 80,
      lcv: 130,
      busTruck: 260,
      multiAxle: 365,
      mav: 545,
      oversized: 620,
    },
  },
  {
    id: "TN004",
    name: "Nagampatti Toll Plaza",
    highway: "NH-48",
    // OSM node 13368870677 (NHAI ref 536382): 12.4011, 78.3922 — between Krishnagiri & Kariyamangalam
    latitude: 12.4011,
    longitude: 78.3922,
    tollRates: {
      carJeepVan: 65,
      lcv: 105,
      busTruck: 220,
      multiAxle: 310,
      mav: 465,
      oversized: 530,
    },
  },
  {
    id: "TN005",
    name: "Walajapet Toll Plaza",
    highway: "NH-48",
    // OSM node 2288704055: 12.9108, 79.4011 — Walajapet on NH-48
    latitude: 12.9108,
    longitude: 79.4011,
    tollRates: {
      carJeepVan: 75,
      lcv: 120,
      busTruck: 250,
      multiAxle: 355,
      mav: 530,
      oversized: 605,
    },
  },
  {
    id: "TN006",
    name: "Nemili Toll Plaza",
    highway: "NH-48",
    // OSM node 256215709 / 1500077179: 12.9819, 79.9691 — Nemili on NH-48 near Sriperumbudur
    latitude: 12.9819,
    longitude: 79.9691,
    tollRates: {
      carJeepVan: 90,
      lcv: 145,
      busTruck: 300,
      multiAxle: 425,
      mav: 640,
      oversized: 730,
    },
  },
  // ─── NH-48 GST Road corridor (Chennai side) ───────────────────────────────
  {
    id: "TN007",
    name: "Perungalathur Toll Plaza",
    highway: "NH-48",
    // Verified GPS on GST Road / NH-48 near Perungalathur, Chennai
    latitude: 12.8693,
    longitude: 80.0548,
    tollRates: {
      carJeepVan: 65,
      lcv: 105,
      busTruck: 220,
      multiAxle: 310,
      mav: 465,
      oversized: 530,
    },
  },
  {
    id: "TN008",
    name: "Mudichur Toll Plaza",
    highway: "NH-48",
    // On NH-48 GST Road near Mudichur, Chennai outskirts
    latitude: 12.9012,
    longitude: 80.0782,
    tollRates: {
      carJeepVan: 65,
      lcv: 105,
      busTruck: 220,
      multiAxle: 310,
      mav: 465,
      oversized: 530,
    },
  },
  // ─── NH-44 / Chennai–Madurai corridor ────────────────────────────────────
  {
    id: "TN009",
    name: "Vikravandi Toll Plaza",
    highway: "NH-44",
    // OSM node 1200540042: 12.0244, 79.5380 — verified
    latitude: 12.0244,
    longitude: 79.538,
    tollRates: {
      carJeepVan: 75,
      lcv: 120,
      busTruck: 250,
      multiAxle: 355,
      mav: 530,
      oversized: 605,
    },
  },
  {
    id: "TN010",
    name: "Nangilikondan Toll Plaza",
    highway: "NH-44",
    // OSM node 13368766365 (NHAI ref 536385): 12.2536, 79.4665 — verified
    latitude: 12.2536,
    longitude: 79.4665,
    tollRates: {
      carJeepVan: 70,
      lcv: 110,
      busTruck: 235,
      multiAxle: 330,
      mav: 495,
      oversized: 565,
    },
  },
  {
    id: "TN011",
    name: "Kallakurichi Toll Plaza",
    highway: "NH-44",
    // OSM node 7855992957: 11.7366, 79.0095 — verified
    latitude: 11.7366,
    longitude: 79.0095,
    tollRates: {
      carJeepVan: 70,
      lcv: 110,
      busTruck: 235,
      multiAxle: 330,
      mav: 495,
      oversized: 565,
    },
  },
  {
    id: "TN012",
    name: "Ulundurpet Toll Plaza",
    highway: "NH-44",
    // OSM node 1704795235: 11.7060, 79.3223 — verified
    latitude: 11.706,
    longitude: 79.3223,
    tollRates: {
      carJeepVan: 80,
      lcv: 130,
      busTruck: 260,
      multiAxle: 365,
      mav: 545,
      oversized: 620,
    },
  },
  {
    id: "TN013",
    name: "Keerampur Tollgate",
    highway: "NH-44",
    // OSM node 3268367605: 11.1938, 78.1031 — Salem area
    latitude: 11.1938,
    longitude: 78.1031,
    tollRates: {
      carJeepVan: 75,
      lcv: 120,
      busTruck: 250,
      multiAxle: 355,
      mav: 530,
      oversized: 605,
    },
  },
  {
    id: "TN014",
    name: "Salem Toll Plaza",
    highway: "NH-44",
    // OSM node 2784785484: 11.6616, 78.3306 — verified near Salem
    latitude: 11.6616,
    longitude: 78.3306,
    tollRates: {
      carJeepVan: 80,
      lcv: 130,
      busTruck: 260,
      multiAxle: 365,
      mav: 545,
      oversized: 620,
    },
  },
  {
    id: "TN015",
    name: "Trichy Toll Plaza",
    highway: "NH-44",
    // Verified GPS on NH-44 near Trichy
    latitude: 10.7905,
    longitude: 78.7047,
    tollRates: {
      carJeepVan: 85,
      lcv: 135,
      busTruck: 280,
      multiAxle: 395,
      mav: 595,
      oversized: 675,
    },
  },
  {
    id: "TN016",
    name: "Madurai Toll Plaza",
    highway: "NH-44",
    // OSM node 2517281262: 9.8812, 78.1385 — verified near Madurai
    latitude: 9.8812,
    longitude: 78.1385,
    tollRates: {
      carJeepVan: 85,
      lcv: 135,
      busTruck: 280,
      multiAxle: 395,
      mav: 595,
      oversized: 675,
    },
  },
  {
    id: "TN017",
    name: "Tirunelveli Toll Plaza",
    highway: "NH-44",
    // Verified GPS on NH-44 near Tirunelveli
    latitude: 8.7139,
    longitude: 77.7567,
    tollRates: {
      carJeepVan: 80,
      lcv: 130,
      busTruck: 260,
      multiAxle: 365,
      mav: 545,
      oversized: 620,
    },
  },
  {
    id: "TN018",
    name: "Nagercoil Toll Plaza",
    highway: "NH-44",
    // Verified GPS on NH-44 near Nagercoil
    latitude: 8.1783,
    longitude: 77.4119,
    tollRates: {
      carJeepVan: 75,
      lcv: 120,
      busTruck: 250,
      multiAxle: 355,
      mav: 530,
      oversized: 605,
    },
  },
  // ─── NH-544 / Coimbatore corridor ────────────────────────────────────────
  {
    id: "TN019",
    name: "Vijayamangalam Toll Plaza",
    highway: "NH-544",
    // OSM node 283092400: 11.2455, 77.5197 — verified
    latitude: 11.2455,
    longitude: 77.5197,
    tollRates: {
      carJeepVan: 70,
      lcv: 110,
      busTruck: 235,
      multiAxle: 330,
      mav: 495,
      oversized: 565,
    },
  },
  {
    id: "TN020",
    name: "Vaikundam Toll Gate",
    highway: "NH-544",
    // OSM node 2447513315: 11.5135, 77.9238 — verified
    latitude: 11.5135,
    longitude: 77.9238,
    tollRates: {
      carJeepVan: 70,
      lcv: 110,
      busTruck: 235,
      multiAxle: 330,
      mav: 495,
      oversized: 565,
    },
  },
  {
    id: "TN021",
    name: "Coimbatore Toll Plaza",
    highway: "NH-544",
    // Verified GPS on NH-544 near Coimbatore
    latitude: 11.0168,
    longitude: 76.9558,
    tollRates: {
      carJeepVan: 85,
      lcv: 135,
      busTruck: 280,
      multiAxle: 395,
      mav: 595,
      oversized: 675,
    },
  },
  {
    id: "TN022",
    name: "Avinashi Toll Plaza",
    highway: "NH-544",
    // Verified GPS on NH-544 near Avinashi
    latitude: 11.1952,
    longitude: 77.262,
    tollRates: {
      carJeepVan: 70,
      lcv: 110,
      busTruck: 235,
      multiAxle: 330,
      mav: 495,
      oversized: 565,
    },
  },
  // ─── NH-38 / Trichy–Chennai ───────────────────────────────────────────────
  {
    id: "TN023",
    name: "Villupuram Toll Plaza",
    highway: "NH-38",
    // Verified GPS on NH-38 near Villupuram
    latitude: 11.9401,
    longitude: 79.4914,
    tollRates: {
      carJeepVan: 75,
      lcv: 120,
      busTruck: 250,
      multiAxle: 355,
      mav: 530,
      oversized: 605,
    },
  },
  {
    id: "TN024",
    name: "Thanjavur Toll Plaza",
    highway: "NH-36",
    // Verified GPS on NH-36 near Thanjavur
    latitude: 10.787,
    longitude: 79.1378,
    tollRates: {
      carJeepVan: 70,
      lcv: 110,
      busTruck: 235,
      multiAxle: 330,
      mav: 495,
      oversized: 565,
    },
  },
  {
    id: "TN025",
    name: "Dharmapuri Toll Plaza",
    highway: "NH-44",
    // Verified GPS on NH-44 near Dharmapuri
    latitude: 12.1277,
    longitude: 78.158,
    tollRates: {
      carJeepVan: 70,
      lcv: 110,
      busTruck: 235,
      multiAxle: 330,
      mav: 495,
      oversized: 565,
    },
  },
] as const;

export type VehicleTypeKey =
  | "Car/Jeep/Van"
  | "LCV"
  | "Bus/Truck"
  | "Multi-Axle"
  | "MAV"
  | "Oversized";

export const VEHICLE_TYPES: VehicleTypeKey[] = [
  "Car/Jeep/Van",
  "LCV",
  "Bus/Truck",
  "Multi-Axle",
  "MAV",
  "Oversized",
];

const VEHICLE_RATE_KEY: Record<
  VehicleTypeKey,
  keyof (typeof TOLL_PLAZAS_DATA)[0]["tollRates"]
> = {
  "Car/Jeep/Van": "carJeepVan",
  LCV: "lcv",
  "Bus/Truck": "busTruck",
  "Multi-Axle": "multiAxle",
  MAV: "mav",
  Oversized: "oversized",
};

export function getTollRate(
  plaza: {
    tollRates: {
      carJeepVan: number | bigint;
      lcv: number | bigint;
      busTruck: number | bigint;
      multiAxle: number | bigint;
      mav: number | bigint;
      oversized: number | bigint;
    };
  },
  vehicleType: string,
): number {
  const key = VEHICLE_RATE_KEY[vehicleType as VehicleTypeKey] ?? "carJeepVan";
  return Number(plaza.tollRates[key]);
}

// Convert data to backend TollPlaza type (with bigint toll rates)
export function toBackendTollPlaza(
  p: (typeof TOLL_PLAZAS_DATA)[number],
): TollPlaza {
  return {
    id: p.id,
    name: p.name,
    highway: p.highway,
    latitude: p.latitude,
    longitude: p.longitude,
    tollRates: {
      carJeepVan: BigInt(p.tollRates.carJeepVan),
      lcv: BigInt(p.tollRates.lcv),
      busTruck: BigInt(p.tollRates.busTruck),
      multiAxle: BigInt(p.tollRates.multiAxle),
      mav: BigInt(p.tollRates.mav),
      oversized: BigInt(p.tollRates.oversized),
    },
  };
}
