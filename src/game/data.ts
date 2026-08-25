import type { V } from "./math";

export const COLS = 22;
export const ROWS = 14;
export const TILE = 48;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

export const START_GOLD = 280;
export const START_LIVES = 25;
export const WAVE_COUNTDOWN = 12;
export const SELL_RATIO = 0.62;
export const MAX_WAVES_CAMPAIGN = 30;
/** Snapshot gravado antes das evoluções grandes. */
export const GAME_VERSION = "1.0.0";

export type TileKind = "build" | "path" | "block" | "core" | "spawn";
export type TowerId =
  | "pulse"
  | "frost"
  | "arc"
  | "lance"
  | "missile"
  | "prism"
  | "beacon";
export type EnemyId =
  | "bit"
  | "runner"
  | "tank"
  | "swarm"
  | "wraith"
  | "hex"
  | "carrier"
  | "overlord";
export type TargetMode = "first" | "last" | "strong" | "close";
export type SpeedMode = 0 | 1 | 2 | 3;

export type TowerDef = {
  id: TowerId;
  name: string;
  blurb: string;
  hotkey: string;
  cost: number;
  color: string;
  color2: string;
  hitsFlying: boolean;
  isAura: boolean;
  range: [number, number, number];
  damage: [number, number, number];
  rate: [number, number, number];
  extra: string;
};

export type EnemyDef = {
  id: EnemyId;
  name: string;
  hp: number;
  speed: number;
  armor: number;
  bounty: number;
  lives: number;
  flying: boolean;
  radius: number;
  color: string;
  color2: string;
};

export const TOWERS: Record<TowerId, TowerDef> = {
  pulse: {
    id: "pulse",
    name: "Pulso",
    blurb: "Canhão verde de impacto. Explode em área; não acerta espectros.",
    hotkey: "1",
    cost: 70,
    color: "#3ee06a",
    color2: "#145a2c",
    hitsFlying: false,
    isAura: false,
    range: [150, 168, 190],
    damage: [26, 40, 62],
    rate: [0.85, 1.05, 1.28],
    extra: "Splash 48 / 62 / 80",
  },
  frost: {
    id: "frost",
    name: "Crio",
    blurb: "Cristal de gelo azul. Pouco dano; congela e acerta voadores.",
    hotkey: "2",
    cost: 90,
    color: "#7ecbff",
    color2: "#1a4a7a",
    hitsFlying: true,
    isAura: false,
    range: [140, 155, 175],
    damage: [10, 16, 24],
    rate: [1.1, 1.3, 1.55],
    extra: "Lentidão 40% / 50% / 62%",
  },
  arc: {
    id: "arc",
    name: "Arco",
    blurb: "Relâmpago em cadeia. Devasta grupos densos.",
    hotkey: "3",
    cost: 130,
    color: "#c9a6ff",
    color2: "#5b3db3",
    hitsFlying: true,
    isAura: false,
    range: [132, 148, 168],
    damage: [18, 28, 44],
    rate: [0.95, 1.15, 1.4],
    extra: "Saltos 3 / 4 / 5",
  },
  lance: {
    id: "lance",
    name: "Lança",
    blurb: "Tiro instantâneo de longo alcance. Perfurante contra blindados.",
    hotkey: "4",
    cost: 165,
    color: "#ffd56a",
    color2: "#a86a12",
    hitsFlying: true,
    isAura: false,
    range: [230, 270, 320],
    damage: [55, 90, 145],
    rate: [0.38, 0.48, 0.6],
    extra: "Ignora 55% da armadura",
  },
  missile: {
    id: "missile",
    name: "Míssil",
    blurb: "Projétil teleguiado com detonação ampla. Lento, brutal.",
    hotkey: "5",
    cost: 190,
    color: "#ff7a4d",
    color2: "#8c2a18",
    hitsFlying: true,
    isAura: false,
    range: [175, 200, 230],
    damage: [48, 78, 120],
    rate: [0.42, 0.52, 0.66],
    extra: "Splash 78 / 96 / 118",
  },
  prism: {
    id: "prism",
    name: "Prisma",
    blurb: "Raio contínuo que queima. Precisa travar o alvo.",
    hotkey: "6",
    cost: 220,
    color: "#ff4d9a",
    color2: "#8a184e",
    hitsFlying: true,
    isAura: false,
    range: [155, 175, 200],
    damage: [46, 72, 110],
    rate: [10, 12, 14],
    extra: "DPS contínuo + queimadura",
  },
  beacon: {
    id: "beacon",
    name: "Farol",
    blurb: "Não ataca. Amplifica cadência e alcance das torres vizinhas.",
    hotkey: "7",
    cost: 150,
    color: "#b8ff6a",
    color2: "#3d7a18",
    hitsFlying: false,
    isAura: true,
    range: [130, 155, 185],
    damage: [0, 0, 0],
    rate: [0, 0, 0],
    extra: "Aura +cadência / +alcance",
  },
};

export const TOWER_ORDER: TowerId[] = [
  "pulse",
  "frost",
  "arc",
  "lance",
  "missile",
  "prism",
  "beacon",
];

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  bit: {
    id: "bit",
    name: "Bit",
    hp: 42,
    speed: 58,
    armor: 0,
    bounty: 6,
    lives: 1,
    flying: false,
    radius: 11,
    color: "#7dffc3",
    color2: "#1f6a4a",
  },
  runner: {
    id: "runner",
    name: "Veloz",
    hp: 28,
    speed: 118,
    armor: 0,
    bounty: 7,
    lives: 1,
    flying: false,
    radius: 9,
    color: "#ffe36a",
    color2: "#8a6a10",
  },
  tank: {
    id: "tank",
    name: "Blindado",
    hp: 220,
    speed: 38,
    armor: 8,
    bounty: 16,
    lives: 2,
    flying: false,
    radius: 15,
    color: "#9aa7c2",
    color2: "#3a4458",
  },
  swarm: {
    id: "swarm",
    name: "Enxame",
    hp: 16,
    speed: 88,
    armor: 0,
    bounty: 3,
    lives: 1,
    flying: false,
    radius: 7,
    color: "#c6ff4d",
    color2: "#4a6a10",
  },
  wraith: {
    id: "wraith",
    name: "Espectro",
    hp: 55,
    speed: 78,
    armor: 1,
    bounty: 12,
    lives: 1,
    flying: true,
    radius: 12,
    color: "#c9b6ff",
    color2: "#4a2a88",
  },
  hex: {
    id: "hex",
    name: "Hex",
    hp: 130,
    speed: 50,
    armor: 3,
    bounty: 14,
    lives: 2,
    flying: false,
    radius: 13,
    color: "#6ad8ff",
    color2: "#185a7a",
  },
  carrier: {
    id: "carrier",
    name: "Ninho",
    hp: 260,
    speed: 42,
    armor: 4,
    bounty: 22,
    lives: 3,
    flying: false,
    radius: 16,
    color: "#ffb36a",
    color2: "#8a4a10",
  },
  overlord: {
    id: "overlord",
    name: "Soberano",
    hp: 1750,
    speed: 27,
    armor: 9,
    bounty: 180,
    lives: 7,
    flying: false,
    radius: 27,
    color: "#ff4d6d",
    color2: "#6a1020",
  },
};

export const TARGET_LABEL: Record<TargetMode, string> = {
  first: "Primeiro",
  last: "Último",
  strong: "Forte",
  close: "Perto",
};

/** Waypoints in tile units. Two lanes converge on the core. */
export const LANES: V[][] = [
  [
    { x: -1.1, y: 3 },
    { x: 5, y: 3 },
    { x: 5, y: 5.5 },
    { x: 8.5, y: 5.5 },
    { x: 8.5, y: 2.2 },
    { x: 13.5, y: 2.2 },
    { x: 13.5, y: 6.4 },
    { x: 19.6, y: 6.4 },
  ],
  [
    { x: -1.1, y: 10 },
    { x: 5, y: 10 },
    { x: 5, y: 8.4 },
    { x: 8.5, y: 8.4 },
    { x: 8.5, y: 11.6 },
    { x: 13.5, y: 11.6 },
    { x: 13.5, y: 7.2 },
    { x: 19.6, y: 7.2 },
  ],
];

export const CORE_CELLS: Array<[number, number]> = [
  [19, 5],
  [20, 5],
  [21, 5],
  [19, 6],
  [20, 6],
  [21, 6],
  [19, 7],
  [20, 7],
  [21, 7],
];

export const DECOR: Array<[number, number]> = [
  [3, 1],
  [4, 1],
  [3, 12],
  [4, 12],
  [11, 0],
  [16, 1],
  [17, 1],
  [16, 12],
  [17, 12],
  [11, 4],
  [11, 9],
]

export type SpawnSpec = {
  at: number;
  lane: 0 | 1;
  kind: EnemyId;
};

export type WavePlan = {
  name: string;
  hint: string;
  spawns: SpawnSpec[];
};

function pack(
  kind: EnemyId,
  count: number,
  start: number,
  gap: number,
  lanes: Array<0 | 1> = [0, 1],
): SpawnSpec[] {
  const out: SpawnSpec[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      at: start + i * gap,
      lane: lanes[i % lanes.length]!,
      kind,
    });
  }
  return out;
}

export function planWave(wave: number): WavePlan {
  const n = wave;
  const boss = n % 10 === 0;
  const elite = n % 5 === 0 && !boss;
  const spawns: SpawnSpec[] = [];

  if (boss) {
    const tier = n / 10;
    spawns.push({ at: 1.2, lane: 0, kind: "overlord" });
    if (tier >= 2) spawns.push({ at: 10.5, lane: 1, kind: "overlord" });
    spawns.push(...pack("tank", 4 + tier, 0.5, 1.15));
    spawns.push(...pack("wraith", 6 + tier, 3.5, 0.58));
    spawns.push(...pack("hex", 3 + tier, 6.2, 0.9));
    return {
      name: tier === 1 ? "PROTOCOLO SOBERANO" : `SOBERANO NÍVEL ${tier}`,
      hint: "Na onda 20 o segundo Soberano entra depois. Lança/Prisma no Forte, Crio para atrasar.",
      spawns,
    };
  }

  if (n === 1) {
    return {
      name: "SINAL INICIAL",
      hint: "Canhão verde (Pulso) nos gargalos. Crio azul só para atrasar.",
      spawns: pack("bit", 8, 0.3, 0.7),
    };
  }
  if (n === 2) {
    return {
      name: "VARREDURA",
      hint: "Velozes furam a linha se o alcance for curto.",
      spawns: [...pack("bit", 8, 0.2, 0.55), ...pack("runner", 6, 3, 0.4)],
    };
  }
  if (n === 3) {
    return {
      name: "CASCA GROSSA",
      hint: "Blindados pedem dano constante — Lança ou Prisma.",
      spawns: [...pack("bit", 10, 0.2, 0.45), ...pack("tank", 3, 2.2, 1.6)],
    };
  }

  const bits = 8 + n * 2;
  const runners = n >= 4 ? 4 + n : 0;
  const tanks = n >= 6 ? 2 + Math.floor(n / 3) : 0;
  const swarms = n >= 7 ? 10 + n : 0;
  const wraiths = n >= 8 ? 3 + Math.floor(n / 4) : 0;
  const hexes = n >= 9 ? 2 + Math.floor(n / 5) : 0;
  const carriers = n >= 12 ? 1 + Math.floor(n / 8) : 0;

  spawns.push(...pack("bit", bits, 0.15, Math.max(0.22, 0.55 - n * 0.012)));
  if (runners) spawns.push(...pack("runner", runners, 1.4, 0.32));
  if (tanks) spawns.push(...pack("tank", tanks, 2.2, 1.15));
  if (swarms) spawns.push(...pack("swarm", swarms, 0.8, 0.18));
  if (wraiths) spawns.push(...pack("wraith", wraiths, 3.1, 0.5));
  if (hexes) spawns.push(...pack("hex", hexes, 4, 1.0));
  if (carriers) spawns.push(...pack("carrier", carriers, 5.2, 2.2));

  if (elite) {
    spawns.push(...pack("tank", 4, 1, 0.7));
    spawns.push(...pack("hex", 3, 2, 0.8));
    return {
      name: `PICO DE CARGA ${n}`,
      hint: "Onda elite. Venda torres mal posicionadas se precisar de ouro.",
      spawns,
    };
  }

  const names = [
    "PULSO BINÁRIO",
    "ENXAME LATENTE",
    "RUPTURA",
    "MÁREA",
    "ECO FRIO",
    "MALHA QUEBRADA",
    "INCURSÃO",
    "DESBORDA",
  ];
  return {
    name: names[(n - 1) % names.length]!,
    hint: n > 15 ? "A curva de vida dispara. Faróis e upgrades importam." : "Mantenha cobertura nas duas pistas.",
    spawns,
  };
}

export function enemyScale(wave: number): { hp: number; bounty: number; speed: number } {
  const hp = Math.pow(1.145, Math.max(0, wave - 1)) * (wave > 18 ? Math.pow(1.035, wave - 18) : 1);
  const bounty = 1 + wave * 0.045;
  const speed = 1 + Math.min(0.42, wave * 0.012);
  return { hp, bounty, speed };
}

export function upgradeCost(def: TowerDef, fromTier: number): number {
  if (fromTier === 1) return Math.round(def.cost * 0.9);
  if (fromTier === 2) return Math.round(def.cost * 1.45);
  return 0;
}

export function splashFor(id: TowerId, tier: number): number {
  if (id === "pulse") return [48, 62, 80][tier - 1]!;
  if (id === "missile") return [78, 96, 118][tier - 1]!;
  return 0;
}

export function slowFor(tier: number): number {
  return [0.4, 0.5, 0.62][tier - 1]!;
}

export function chainsFor(tier: number): number {
  return [3, 4, 5][tier - 1]!;
}

export function auraRate(tier: number): number {
  return [0.12, 0.18, 0.26][tier - 1]!;
}

export function auraRange(tier: number): number {
  return [0.08, 0.12, 0.18][tier - 1]!;
}
