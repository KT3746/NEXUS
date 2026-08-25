import { AudioSys } from "./audio";
import {
  COLS,
  ENEMIES,
  MAX_WAVES_CAMPAIGN,
  ROWS,
  SELL_RATIO,
  START_GOLD,
  START_LIVES,
  TILE,
  TOWERS,
  WAVE_COUNTDOWN,
  auraRange,
  auraRate,
  chainsFor,
  enemyScale,
  planWave,
  slowFor,
  splashFor,
  type EnemyId,
  type SpeedMode,
  type TargetMode,
  type TowerId,
  type WavePlan,
  upgradeCost,
} from "./data";
import { buildMap, inBounds, samplePath, tileAt, type MapData } from "./map";
import { clamp, dist, lerpAngle, pick, rand, type V } from "./math";
import { lsNum, lsSet } from "./storage";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: "spark" | "ring" | "smoke" | "glow" | "shard";
};

export type Floater = {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  max: number;
};

export type Bolt = { pts: V[]; life: number; max: number; color: string };

export type Beam = { x1: number; y1: number; x2: number; y2: number; color: string; life: number };

export type Projectile = {
  kind: "shell" | "frost" | "missile";
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  splash: number;
  slow: number;
  targetId: number;
  color: string;
  hitsFlying: boolean;
  life: number;
  turn: number;
  speed: number;
};

export type Enemy = {
  id: number;
  kind: EnemyId;
  lane: 0 | 1;
  x: number;
  y: number;
  ang: number;
  hp: number;
  maxHp: number;
  armor: number;
  speed: number;
  flying: boolean;
  bounty: number;
  lives: number;
  progress: number;
  slowT: number;
  slowMul: number;
  burnT: number;
  burnDps: number;
  radius: number;
  demo: boolean;
  dead: boolean;
};

export type Tower = {
  id: number;
  kind: TowerId;
  c: number;
  r: number;
  x: number;
  y: number;
  tier: 1 | 2 | 3;
  spent: number;
  angle: number;
  cd: number;
  mode: TargetMode;
};

export type Banner = { title: string; sub: string; life: number };

export type Mode = "menu" | "playing" | "paused" | "defeat" | "victory";

export type World = {
  map: MapData;
  mode: Mode;
  gold: number;
  lives: number;
  wave: number;
  score: number;
  kills: number;
  speed: SpeedMode;
  placing: TowerId | null;
  selected: number | null;
  hover: { c: number; r: number } | null;
  showGrid: boolean;
  showCoverage: boolean;
  towers: Tower[];
  enemies: Enemy[];
  projs: Projectile[];
  particles: Particle[];
  floaters: Floater[];
  bolts: Bolt[];
  beams: Beam[];
  banners: Banner[];
  plan: WavePlan | null;
  spawnI: number;
  waveT: number;
  between: number;
  activeWave: boolean;
  shake: number;
  flash: number;
  combo: number;
  comboT: number;
  nextId: number;
  elapsed: number;
  dpr: number;
  occupied: Set<string>;
  best: number;
  campaignOver: boolean;
  hint: string;
  stats: { dmg: number; leaked: number; spent: number };
};

const BEST_KEY = "nexus-best";

function uid(w: World): number {
  w.nextId += 1;
  return w.nextId;
}

export function occupiedKey(c: number, r: number): string {
  return `${c},${r}`;
}

export function createWorld(): World {
  const map = buildMap();
  return {
    map,
    mode: "menu",
    gold: START_GOLD,
    lives: START_LIVES,
    wave: 0,
    score: 0,
    kills: 0,
    speed: 1,
    placing: null,
    selected: null,
    hover: null,
    showGrid: false,
    showCoverage: false,
    towers: [],
    enemies: [],
    projs: [],
    particles: [],
    floaters: [],
    bolts: [],
    beams: [],
    banners: [],
    plan: null,
    spawnI: 0,
    waveT: 0,
    between: 2,
    activeWave: false,
    shake: 0,
    flash: 0,
    combo: 0,
    comboT: 0,
    nextId: 1,
    elapsed: 0,
    dpr: 1,
    occupied: new Set(),
    best: lsNum(BEST_KEY, 0),
    campaignOver: false,
    hint: "Escolha uma torre e clique no mapa para construir.",
    stats: { dmg: 0, leaked: 0, spent: 0 },
  };
}

export function startRun(w: World): void {
  const map = w.map;
  const best = w.best;
  const dpr = w.dpr;
  Object.assign(w, createWorld(), { map, best, dpr, mode: "playing" as const });
  w.between = 4;
  w.hint = "Onda 1 em instantes. Construa nas curvas, cobrindo as duas pistas.";
  banner(w, "LINK ESTABELECIDO", "Defenda o núcleo. Ouro inicial liberado.");
}

export function banner(w: World, title: string, sub: string): void {
  w.banners.push({ title, sub, life: 2.6 });
}

export function burst(
  w: World,
  x: number,
  y: number,
  color: string,
  n: number,
  power = 90,
  kind: Particle["kind"] = "spark",
): void {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(power * 0.2, power);
    w.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(0.25, 0.7),
      max: 0.7,
      size: rand(1.5, kind === "smoke" ? 10 : 4.5),
      color,
      kind,
    });
  }
}

export function ring(w: World, x: number, y: number, color: string, size = 18): void {
  w.particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.35,
    max: 0.35,
    size,
    color,
    kind: "ring",
  });
}

function floater(w: World, x: number, y: number, text: string, color: string): void {
  w.floaters.push({
    x: x + rand(-6, 6),
    y: y - 8,
    vy: rand(-42, -28),
    text,
    color,
    life: 0.85,
    max: 0.85,
  });
}

export function canBuild(w: World, c: number, r: number): boolean {
  if (!inBounds(c, r)) return false;
  if (w.map.tiles[r]![c] !== "build") return false;
  if (w.occupied.has(occupiedKey(c, r))) return false;
  return true;
}

export function placeTower(w: World, kind: TowerId, c: number, r: number, audio: AudioSys): boolean {
  const def = TOWERS[kind];
  if (!canBuild(w, c, r) || w.gold < def.cost) return false;
  w.gold -= def.cost;
  w.stats.spent += def.cost;
  const t: Tower = {
    id: uid(w),
    kind,
    c,
    r,
    x: (c + 0.5) * TILE,
    y: (r + 0.5) * TILE,
    tier: 1,
    spent: def.cost,
    angle: -Math.PI / 2,
    cd: 0.15,
    mode: "first",
  };
  w.towers.push(t);
  w.occupied.add(occupiedKey(c, r));
  w.selected = t.id;
  burst(w, t.x, t.y, def.color, 14, 70, "glow");
  ring(w, t.x, t.y, def.color, 22);
  audio.place();
  return true;
}

export function selectedTower(w: World): Tower | null {
  if (w.selected == null) return null;
  return w.towers.find((t) => t.id === w.selected) ?? null;
}

export function tryUpgrade(w: World, audio: AudioSys): boolean {
  const t = selectedTower(w);
  if (!t || t.tier >= 3) return false;
  const def = TOWERS[t.kind];
  const cost = upgradeCost(def, t.tier);
  if (w.gold < cost) return false;
  w.gold -= cost;
  w.stats.spent += cost;
  t.spent += cost;
  t.tier = (t.tier + 1) as 2 | 3;
  burst(w, t.x, t.y, def.color, 22, 110, "spark");
  ring(w, t.x, t.y, "#fff4b0", 28);
  audio.upgrade();
  floater(w, t.x, t.y, `NÍVEL ${t.tier}`, def.color);
  return true;
}

export function trySell(w: World, audio: AudioSys): boolean {
  const t = selectedTower(w);
  if (!t) return false;
  const back = Math.round(t.spent * SELL_RATIO);
  w.gold += back;
  w.occupied.delete(occupiedKey(t.c, t.r));
  w.towers = w.towers.filter((x) => x.id !== t.id);
  w.selected = null;
  burst(w, t.x, t.y, "#9aa7c2", 16, 80, "smoke");
  audio.sell();
  floater(w, t.x, t.y, `+${back}`, "#b8ff6a");
  return true;
}

export function cycleMode(t: Tower): void {
  const order: TargetMode[] = ["first", "last", "strong", "close"];
  t.mode = order[(order.indexOf(t.mode) + 1) % order.length]!;
}

function isTargetable(w: World, e: Enemy, flyingOk = true): boolean {
  if (e.dead || e.hp <= 0) return false;
  if (e.demo && w.mode !== "menu") return false;
  if (e.flying && !flyingOk) return false;
  return true;
}

function buffed(w: World, t: Tower): { range: number; rate: number; dmg: number } {
  const def = TOWERS[t.kind];
  let range = def.range[t.tier - 1]!;
  let rate = def.rate[t.tier - 1]!;
  const dmg = def.damage[t.tier - 1]!;
  for (const b of w.towers) {
    if (b.kind !== "beacon" || b.id === t.id) continue;
    const auraR = TOWERS.beacon.range[b.tier - 1]!;
    if (dist(t.x, t.y, b.x, b.y) <= auraR) {
      range *= 1 + auraRange(b.tier);
      rate *= 1 + auraRate(b.tier);
    }
  }
  return { range, rate, dmg };
}

function pickTarget(w: World, t: Tower, range: number, flyingOk: boolean): Enemy | null {
  let best: Enemy | null = null;
  let score = -Infinity;
  for (const e of w.enemies) {
    if (!isTargetable(w, e, flyingOk)) continue;
    const d = dist(t.x, t.y, e.x, e.y);
    if (d > range) continue;
    let s = 0;
    if (t.mode === "first") s = e.progress;
    else if (t.mode === "last") s = -e.progress;
    else if (t.mode === "strong") s = e.hp;
    else s = -d;
    if (s > score) {
      score = s;
      best = e;
    }
  }
  return best;
}

function deal(
  w: World,
  e: Enemy,
  raw: number,
  color: string,
  audio: AudioSys,
  pierce = 0,
): void {
  if (e.dead || e.hp <= 0) return;
  const armor = Math.max(0, e.armor * (1 - pierce));
  let dmg = Math.max(raw * 0.35, raw - armor * 2.1);
  const crit = raw >= 1 && Math.random() < 0.08;
  if (crit) dmg *= 2;
  e.hp -= dmg;
  w.stats.dmg += dmg;
  if (dmg >= 1) {
    const shown = Math.round(dmg);
    floater(w, e.x, e.y, crit ? `${shown}!` : String(shown), crit ? "#ffe36a" : color);
  }
  if (e.hp <= 0) kill(w, e, audio);
}

function kill(w: World, e: Enemy, audio: AudioSys): void {
  if (e.dead) return;
  e.dead = true;
  e.hp = 0;
  const def = ENEMIES[e.kind];
  const big = e.kind === "overlord";
  burst(w, e.x, e.y, def.color, big ? 48 : 16, big ? 220 : 90, "spark");
  burst(w, e.x, e.y, def.color2, big ? 18 : 6, big ? 80 : 40, "smoke");
  ring(w, e.x, e.y, def.color, e.radius * 2);
  audio.death(big);
  if (e.demo) return;
  w.gold += e.bounty;
  w.score += e.bounty * 10 + Math.round(e.maxHp * 0.2);
  w.kills += 1;
  w.combo += 1;
  w.comboT = 1.6;
  if (big) {
    w.shake = Math.max(w.shake, 0.85);
    banner(w, "SOBERANO DERRUBADO", `+${e.bounty} ouro · o protocolo recua`);
  }
  if (e.kind === "carrier") {
    for (let i = 0; i < 5; i++) {
      spawnEnemy(w, "swarm", e.lane, e.progress + rand(-12, 12), false);
    }
  }
  if (w.combo === 12) {
    const bonus = 25 + w.wave * 2;
    w.gold += bonus;
    banner(w, "SEQUÊNCIA ×12", `Overload de abates  +${bonus} ouro`);
  }
}

function spawnEnemy(w: World, kind: EnemyId, lane: 0 | 1, progress = 0, demo = false): Enemy {
  const def = ENEMIES[kind];
  const scale = enemyScale(Math.max(1, w.wave));
  const hp = Math.round(def.hp * (demo ? 0.7 : scale.hp) * (kind === "overlord" ? 1 + w.wave * 0.04 : 1));
  const e: Enemy = {
    id: uid(w),
    kind,
    lane,
    x: 0,
    y: 0,
    ang: 0,
    hp,
    maxHp: hp,
    armor: def.armor,
    speed: def.speed * (demo ? 0.85 : scale.speed),
    flying: def.flying,
    bounty: demo ? 0 : Math.round(def.bounty * scale.bounty),
    lives: def.lives,
    progress,
    slowT: 0,
    slowMul: 1,
    burnT: 0,
    burnDps: 0,
    radius: def.radius,
    demo,
    dead: false,
  };
  const s = samplePath(w.map.lanes[lane]!, progress);
  e.x = s.pos.x;
  e.y = s.pos.y;
  e.ang = s.ang;
  w.enemies.push(e);
  return e;
}

function beginWave(w: World, audio: AudioSys): void {
  w.wave += 1;
  w.plan = planWave(w.wave);
  w.spawnI = 0;
  w.waveT = 0;
  w.activeWave = true;
  w.between = 0;
  w.hint = w.plan.hint;
  banner(w, `ONDA ${w.wave} · ${w.plan.name}`, w.plan.hint);
  audio.wave();
}

export function callWave(w: World, audio: AudioSys): void {
  if (w.mode !== "playing" || w.activeWave) return;
  const bonus = Math.round(w.between * 4 + 8);
  w.gold += bonus;
  w.score += bonus * 5;
  floater(w, w.map.core.x - 40, w.map.core.y - 40, `+${bonus} antecipação`, "#ffe36a");
  beginWave(w, audio);
}

function fireAt(w: World, t: Tower, e: Enemy, stats: { range: number; rate: number; dmg: number }, audio: AudioSys): void {
  const def = TOWERS[t.kind];
  t.angle = Math.atan2(e.y - t.y, e.x - t.x);
  t.cd = 1 / Math.max(0.05, stats.rate);
  audio.shoot(t.kind);

  if (t.kind === "pulse" || t.kind === "frost" || t.kind === "missile") {
    const spd = t.kind === "missile" ? 240 : t.kind === "frost" ? 340 : 380;
    const ang = t.angle;
    w.projs.push({
      kind: t.kind === "frost" ? "frost" : t.kind === "missile" ? "missile" : "shell",
      x: t.x + Math.cos(ang) * 16,
      y: t.y + Math.sin(ang) * 16,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      damage: stats.dmg,
      splash: splashFor(t.kind, t.tier),
      slow: t.kind === "frost" ? slowFor(t.tier) : 0,
      targetId: e.id,
      color: def.color,
      hitsFlying: def.hitsFlying,
      life: 1.6,
      turn: t.kind === "missile" ? 7.5 : 0,
      speed: spd,
    });
    burst(w, t.x + Math.cos(ang) * 14, t.y + Math.sin(ang) * 14, def.color, 4, 40, "glow");
  } else if (t.kind === "lance") {
    deal(w, e, stats.dmg, def.color, audio, 0.55);
    w.beams.push({ x1: t.x, y1: t.y, x2: e.x, y2: e.y, color: def.color, life: 0.12 });
    burst(w, e.x, e.y, def.color, 8, 70, "spark");
  } else if (t.kind === "arc") {
    const hit: Enemy[] = [e];
    let from = e;
    const jumps = chainsFor(t.tier);
    for (let j = 1; j < jumps; j++) {
      let nxt: Enemy | null = null;
      let best = 92;
      for (const o of w.enemies) {
        if (!isTargetable(w, o) || hit.includes(o)) continue;
        const d = dist(from.x, from.y, o.x, o.y);
        if (d < best) {
          best = d;
          nxt = o;
        }
      }
      if (!nxt) break;
      hit.push(nxt);
      from = nxt;
    }
    const pts: V[] = [{ x: t.x, y: t.y }];
    hit.forEach((h, i) => {
      deal(w, h, stats.dmg * Math.pow(0.78, i), def.color, audio);
      pts.push({
        x: h.x + rand(-6, 6),
        y: h.y + rand(-6, 6),
      });
    });
    w.bolts.push({ pts, life: 0.16, max: 0.16, color: def.color });
  } else if (t.kind === "prism") {
    const baseRate = def.rate[t.tier - 1]!;
    deal(w, e, stats.dmg / baseRate, def.color, audio);
    e.burnT = 2.4;
    e.burnDps = 7 + t.tier * 5;
    w.beams.push({ x1: t.x, y1: t.y, x2: e.x, y2: e.y, color: def.color, life: 0.08 });
    t.cd = 1 / stats.rate;
  }
}

function explode(w: World, p: Projectile, x: number, y: number, audio: AudioSys): void {
  ring(w, x, y, p.color, 12 + p.splash * 0.15);
  burst(w, x, y, p.color, p.kind === "missile" ? 20 : 10, p.kind === "missile" ? 130 : 70);
  audio.hit();
  for (const e of w.enemies.slice()) {
    if (!isTargetable(w, e, p.hitsFlying)) continue;
    const d = dist(x, y, e.x, e.y);
    const rad = p.splash || 14;
    if (d <= rad + e.radius) {
      const fall = p.splash ? clamp(1 - d / (rad + 8), 0.4, 1) : 1;
      deal(w, e, p.damage * fall, p.color, audio);
      if (p.slow > 0) {
        e.slowT = 1.5;
        e.slowMul = 1 - p.slow;
      }
    }
  }
}

function tickFx(w: World, dt: number): void {
  w.shake = Math.max(0, w.shake - dt * 1.8);
  w.flash = Math.max(0, w.flash - dt * 2.2);
  w.comboT -= dt;
  if (w.comboT <= 0) w.combo = 0;
  w.elapsed += dt;

  for (let i = w.particles.length - 1; i >= 0; i--) {
    const p = w.particles[i]!;
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.9;
    p.vy *= 0.9;
    if (p.kind === "smoke") {
      p.vy -= 18 * dt;
      p.size += 8 * dt;
    }
    if (p.life <= 0) w.particles.splice(i, 1);
  }
  if (w.particles.length > 700) w.particles.splice(0, w.particles.length - 700);

  for (let i = w.floaters.length - 1; i >= 0; i--) {
    const f = w.floaters[i]!;
    f.life -= dt;
    f.y += f.vy * dt;
    if (f.life <= 0) w.floaters.splice(i, 1);
  }
  for (let i = w.bolts.length - 1; i >= 0; i--) {
    w.bolts[i]!.life -= dt;
    if (w.bolts[i]!.life <= 0) w.bolts.splice(i, 1);
  }
  for (let i = w.beams.length - 1; i >= 0; i--) {
    w.beams[i]!.life -= dt;
    if (w.beams[i]!.life <= 0) w.beams.splice(i, 1);
  }
  for (let i = w.banners.length - 1; i >= 0; i--) {
    w.banners[i]!.life -= dt;
    if (w.banners[i]!.life <= 0) w.banners.splice(i, 1);
  }
}

function tickEnemies(w: World, dt: number, audio: AudioSys): void {
  for (let i = w.enemies.length - 1; i >= 0; i--) {
    const e = w.enemies[i]!;
    if (e.hp <= 0 || e.dead) {
      w.enemies.splice(i, 1);
      continue;
    }
    if (e.slowT > 0) e.slowT -= dt;
    else e.slowMul = 1;
    if (e.burnT > 0) {
      e.burnT -= dt;
      deal(w, e, e.burnDps * dt, "#ff4d9a", audio);
      if (Math.random() < 8 * dt) burst(w, e.x, e.y, "#ff4d9a", 1, 20, "glow");
    }
    if (e.kind === "hex" && e.burnT <= 0) {
      e.hp = Math.min(e.maxHp, e.hp + 10 * dt);
    }
    if (e.hp <= 0 || e.dead) {
      w.enemies.splice(i, 1);
      continue;
    }
    const lane = w.map.lanes[e.lane]!;
    const spd = e.speed * e.slowMul;
    e.progress += spd * dt;
    const s = samplePath(lane, e.progress);
    e.x = s.pos.x;
    e.y = s.pos.y + (e.flying ? -10 : 0);
    e.ang = s.ang;
    if (s.done) {
      if (e.demo) {
        w.enemies.splice(i, 1);
        continue;
      }
      w.lives -= e.lives;
      w.stats.leaked += 1;
      w.shake = Math.max(w.shake, 0.55);
      w.flash = 0.55;
      burst(w, w.map.core.x, w.map.core.y, "#ff4d6d", 24, 140);
      audio.leak();
      w.enemies.splice(i, 1);
      if (w.lives <= 0 && w.mode === "playing") {
        w.lives = 0;
        w.mode = "defeat";
        w.speed = 0;
        if (w.score > w.best) {
          w.best = w.score;
          lsSet(BEST_KEY, String(w.best));
        }
        audio.lose();
        banner(w, "NÚCLEO ROMPIDO", "O protocolo caiu. Reconstrua a linha.");
      }
    }
  }
}

function tickProjectiles(w: World, dt: number, audio: AudioSys): void {
  for (let i = w.projs.length - 1; i >= 0; i--) {
    const p = w.projs[i]!;
    p.life -= dt;
    if (p.kind === "missile") {
      const tgt = w.enemies.find((e) => e.id === p.targetId && isTargetable(w, e));
      if (tgt) {
        const want = Math.atan2(tgt.y - p.y, tgt.x - p.x);
        const have = Math.atan2(p.vy, p.vx);
        const ang = lerpAngle(have, want, clamp(p.turn * dt, 0, 1));
        p.vx = Math.cos(ang) * p.speed;
        p.vy = Math.sin(ang) * p.speed;
      }
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    let hit = false;
    for (const e of w.enemies) {
      if (!isTargetable(w, e, p.hitsFlying)) continue;
      if (dist(p.x, p.y, e.x, e.y) <= e.radius + 6) {
        explode(w, p, e.x, e.y, audio);
        hit = true;
        break;
      }
    }
    if (!hit && p.life <= 0) {
      explode(w, p, p.x, p.y, audio);
      hit = true;
    }
    if (hit || p.x < -40 || p.y < -40 || p.x > COLS * TILE + 40 || p.y > ROWS * TILE + 40) {
      w.projs.splice(i, 1);
    }
  }
}

function tickTowers(w: World, dt: number, audio: AudioSys): void {
  for (const t of w.towers) {
    if (t.kind === "beacon" || TOWERS[t.kind].isAura) {
      t.angle += dt * 0.7;
      if (Math.random() < 3 * dt) {
        w.particles.push({
          x: t.x + rand(-8, 8),
          y: t.y + rand(-8, 8),
          vx: rand(-8, 8),
          vy: rand(-22, -8),
          life: 0.6,
          max: 0.6,
          size: 3,
          color: TOWERS.beacon.color,
          kind: "glow",
        });
      }
      continue;
    }
    t.cd -= dt;
    const stats = buffed(w, t);
    const def = TOWERS[t.kind];
    const tgt = pickTarget(w, t, stats.range, def.hitsFlying);
    if (tgt) {
      const want = Math.atan2(tgt.y - t.y, tgt.x - t.x);
      t.angle = lerpAngle(t.angle, want, clamp(dt * (t.kind === "prism" ? 5 : 10), 0, 1));
      if (t.cd <= 0) fireAt(w, t, tgt, stats, audio);
    }
  }
}

function tickWaves(w: World, dt: number, audio: AudioSys): void {
  if (w.mode !== "playing") return;
  if (!w.activeWave) {
    w.between -= dt;
    if (w.between <= 0) beginWave(w, audio);
    return;
  }
  if (!w.plan) return;
  w.waveT += dt;
  while (w.spawnI < w.plan.spawns.length && w.plan.spawns[w.spawnI]!.at <= w.waveT) {
    const s = w.plan.spawns[w.spawnI]!;
    spawnEnemy(w, s.kind, s.lane);
    w.spawnI += 1;
  }
  const spawningDone = w.spawnI >= w.plan.spawns.length;
  const alive = w.enemies.some((e) => !e.demo && !e.dead && e.hp > 0);
  if (spawningDone && !alive) {
    w.activeWave = false;
    const clearBonus = 20 + w.wave * 4;
    w.gold += clearBonus;
    w.score += 100 + w.wave * 25;
    if (w.wave >= MAX_WAVES_CAMPAIGN && !w.campaignOver) {
      w.campaignOver = true;
      w.mode = "victory";
      w.speed = 1;
      if (w.score > w.best) {
        w.best = w.score;
        lsSet(BEST_KEY, String(w.best));
      }
      audio.win();
      banner(w, "PROTOCOLO CONTIDO", "30 ondas. Continue no infinito se quiser.");
    } else {
      w.between = WAVE_COUNTDOWN - Math.min(6, w.wave * 0.12);
      banner(w, `ONDA ${w.wave} LIMPA`, `+${clearBonus} ouro · próxima em ${w.between.toFixed(0)}s`);
    }
  }
}

function tickDemo(w: World, dt: number): void {
  if (w.mode !== "menu") return;
  if (w.enemies.filter((e) => e.demo).length < 10 && Math.random() < 1.6 * dt) {
    const kinds: EnemyId[] = ["bit", "runner", "tank", "wraith", "swarm"];
    spawnEnemy(w, pick(kinds), Math.random() < 0.5 ? 0 : 1, 0, true);
  }
  if (w.towers.length === 0) {
    const spots: Array<[TowerId, number, number]> = [
      ["pulse", 6, 4],
      ["arc", 9, 6],
      ["frost", 6, 9],
      ["lance", 15, 5],
      ["prism", 15, 8],
      ["beacon", 12, 6],
    ];
    for (const [kind, c, r] of spots) {
      if (!canBuild(w, c, r)) continue;
      const def = TOWERS[kind];
      const t: Tower = {
        id: uid(w),
        kind,
        c,
        r,
        x: (c + 0.5) * TILE,
        y: (r + 0.5) * TILE,
        tier: 2,
        spent: 0,
        angle: 0,
        cd: rand(0, 0.8),
        mode: "first",
      };
      w.towers.push(t);
      w.occupied.add(occupiedKey(c, r));
      void def;
    }
  }
}

export function continueEndless(w: World): void {
  w.mode = "playing";
  w.between = 5;
  w.hint = "Modo infinito. A vida dos invasores não para de crescer.";
  banner(w, "OVERFLOW ATIVO", "Campanha concluída. Sobreviva o quanto puder.");
}

export function rangeOf(w: World, t: Tower): number {
  return buffed(w, t).range;
}

export function tickWorld(w: World, dt: number, audio: AudioSys): void {
  const cap = Math.min(dt, 0.05);
  tickDemo(w, cap);
  if (w.mode === "paused" || w.mode === "defeat" || w.mode === "victory") {
    tickFx(w, cap * (w.mode === "paused" ? 0.2 : 1));
    return;
  }
  const steps = w.speed === 3 ? 3 : w.speed === 2 ? 2 : 1;
  if (w.speed === 0 && w.mode === "playing") {
    tickFx(w, cap);
    return;
  }
  for (let s = 0; s < (w.mode === "menu" ? 1 : steps); s++) {
    tickWaves(w, cap, audio);
    tickTowers(w, cap, audio);
    tickProjectiles(w, cap, audio);
    tickEnemies(w, cap, audio);
    tickFx(w, cap);
  }
}

export function worldFromPointer(
  canvas: HTMLCanvasElement,
  sx: number,
  sy: number,
): V {
  const r = canvas.getBoundingClientRect();
  const x = ((sx - r.left) / r.width) * (COLS * TILE);
  const y = ((sy - r.top) / r.height) * (ROWS * TILE);
  return { x, y };
}

export function hoverFromWorld(w: World, pos: V): void {
  const { c, r } = tileAt(pos.x, pos.y);
  w.hover = inBounds(c, r) ? { c, r } : null;
}
