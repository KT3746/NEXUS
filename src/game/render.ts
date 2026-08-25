import { COLS, ENEMIES, ROWS, START_LIVES, TILE, TOWERS, WORLD_H, WORLD_W } from "./data";
import { hash } from "./math";
import { canBuild, rangeOf, type Enemy, type Tower, type World } from "./sim";

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 0.35): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D, t: number): void {
  const bg = ctx.createLinearGradient(0, 0, WORLD_W, WORLD_H);
  bg.addColorStop(0, "#071018");
  bg.addColorStop(0.5, "#0a1422");
  bg.addColorStop(1, "#0b0d18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 55; i++) {
    const hx = hash(i + 3);
    const hy = hash(i + 17);
    const x = hx * WORLD_W;
    const y = (hy * WORLD_H + t * (8 + hx * 12)) % WORLD_H;
    ctx.fillStyle = i % 5 === 0 ? "#7dffc3" : i % 3 === 0 ? "#5ce1ff" : "#c9a6ff";
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  ctx.restore();
}

function drawTiles(ctx: CanvasRenderingContext2D, w: World, t: number): void {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const kind = w.map.tiles[r]![c]!;
      const x = c * TILE;
      const y = r * TILE;
      if (kind === "block") {
        ctx.fillStyle = "#0c121c";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = "rgba(80,110,140,0.12)";
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
        if ((c + r) % 3 === 0) {
          ctx.fillStyle = "rgba(90,120,150,0.08)";
          ctx.fillRect(x + 10, y + 14, TILE - 20, 3);
        }
      } else if (kind === "build") {
        const pulse = 0.04 + 0.03 * Math.sin(t * 1.3 + c * 0.4 + r * 0.3);
        ctx.fillStyle = `rgba(18, 36, 52, ${0.55 + pulse})`;
        ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = "rgba(60, 140, 160, 0.07)";
        ctx.fillRect(x + TILE / 2 - 1, y + 8, 2, TILE - 16);
      } else if (kind === "path" || kind === "spawn") {
        ctx.fillStyle = "#102030";
        ctx.fillRect(x, y, TILE, TILE);
      } else if (kind === "core") {
        ctx.fillStyle = "#101828";
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const lane of w.map.lanes) {
    ctx.beginPath();
    ctx.moveTo(lane[0]!.x, lane[0]!.y);
    for (let i = 1; i < lane.length; i++) ctx.lineTo(lane[i]!.x, lane[i]!.y);
    ctx.strokeStyle = "rgba(40, 90, 120, 0.85)";
    ctx.lineWidth = 38;
    ctx.stroke();
    ctx.strokeStyle = "rgba(20, 40, 58, 0.95)";
    ctx.lineWidth = 28;
    ctx.stroke();
  }
  ctx.setLineDash([10, 16]);
  ctx.lineDashOffset = -t * 42;
  for (const lane of w.map.lanes) {
    ctx.beginPath();
    ctx.moveTo(lane[0]!.x, lane[0]!.y);
    for (let i = 1; i < lane.length; i++) ctx.lineTo(lane[i]!.x, lane[i]!.y);
    ctx.strokeStyle = "rgba(92, 225, 255, 0.55)";
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  for (const [c, r] of [
    [0, 3],
    [0, 10],
  ] as const) {
    const x = c * TILE + TILE * 0.4;
    const y = r * TILE + TILE * 0.5;
    glow(ctx, x, y, 48, "#5ce1ff", 0.35 + 0.12 * Math.sin(t * 3));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.8);
    ctx.strokeStyle = "rgba(92,225,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.rotate(-t * 1.6);
    ctx.strokeStyle = "rgba(184,255,106,0.7)";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 1.2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCore(ctx: CanvasRenderingContext2D, w: World, t: number): void {
  const { x, y } = w.map.core;
  const danger = w.mode === "playing" ? 1 - w.lives / START_LIVES : 0.2;
  glow(ctx, x, y, 90, danger > 0.5 ? "#ff4d6d" : "#5ce1ff", 0.28 + 0.1 * Math.sin(t * 2));
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 3; i++) {
    ctx.rotate(t * (0.4 + i * 0.12) + i);
    ctx.strokeStyle = i === 0 ? "rgba(255,77,154,0.55)" : "rgba(92,225,255,0.45)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -28 - i * 6);
    ctx.lineTo(18 + i * 3, 12 + i);
    ctx.lineTo(-18 - i * 3, 12 + i);
    ctx.closePath();
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
  g.addColorStop(0, "#fff7d6");
  g.addColorStop(0.45, lerpColor(danger));
  g.addColorStop(1, "rgba(20,10,30,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function lerpColor(danger: number): string {
  return danger > 0.55 ? "#ff4d6d" : "#5ce1ff";
}

function drawCoverage(ctx: CanvasRenderingContext2D, w: World): void {
  if (!w.showCoverage) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const t of w.towers) {
    const def = TOWERS[t.kind];
    const r = rangeOf(w, t);
    ctx.fillStyle = hexAlpha(def.color, 0.07);
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function hexAlpha(hex: string, a: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function drawTower(ctx: CanvasRenderingContext2D, t: Tower, selected: boolean, time: number, w: World): void {
  const def = TOWERS[t.kind];
  glow(ctx, t.x, t.y, 22 + t.tier * 4, def.color, selected ? 0.4 : 0.18);
  ctx.save();
  ctx.translate(t.x, t.y);

  ctx.fillStyle = "#0e1620";
  ctx.strokeStyle = def.color;
  ctx.lineWidth = selected ? 2.4 : 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < t.tier; i++) {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(-8 + i * 8, 18, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.rotate(t.angle);
  ctx.fillStyle = def.color;
  ctx.strokeStyle = def.color2;
  ctx.lineWidth = 1.2;

  if (t.kind === "pulse") {
    roundRect(ctx, -8, -9, 24, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#d8ffd8";
    ctx.fillRect(12, -4, 10, 8);
    ctx.fillStyle = def.color2;
    ctx.fillRect(-6, -5, 8, 10);
  } else if (t.kind === "frost") {
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-6, -11);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#eaf6ff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.moveTo(-6, -4);
    ctx.lineTo(8, 4);
    ctx.moveTo(-6, 4);
    ctx.lineTo(8, -4);
    ctx.stroke();
  } else if (t.kind === "arc") {
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(4, i * 7, 7, -0.6, 0.6);
      ctx.stroke();
    }
    ctx.fillRect(-6, -4, 12, 8);
  } else if (t.kind === "lance") {
    ctx.fillRect(-10, -3, 28, 6);
    ctx.fillStyle = "#fff1b0";
    ctx.fillRect(14, -2, 12, 4);
    ctx.fillStyle = def.color2;
    ctx.fillRect(-8, -8, 10, 16);
  } else if (t.kind === "missile") {
    roundRect(ctx, -6, -10, 14, 20, 4);
    ctx.fill();
    ctx.fillRect(6, -4, 16, 3);
    ctx.fillRect(6, 1, 16, 3);
  } else if (t.kind === "prism") {
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-6, -11);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd1e8";
    ctx.beginPath();
    ctx.arc(2, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.rotate(-t.angle + time);
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(0, 13);
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.stroke();
  }
  ctx.restore();

  if (selected) {
    ctx.save();
    ctx.strokeStyle = hexAlpha(def.color, 0.55);
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -time * 28;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, rangeOf(w, t), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number): void {
  const def = ENEMIES[e.kind];
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.ang);
  if (e.flying) {
    ctx.globalAlpha = 0.85;
    glow(ctx, 0, 0, e.radius * 2.2, def.color, 0.35);
  }
  if (e.slowT > 0) glow(ctx, 0, 0, e.radius * 2, "#9be8ff", 0.3);
  if (e.burnT > 0) glow(ctx, 0, 0, e.radius * 2, "#ff4d9a", 0.28);

  ctx.fillStyle = def.color2;
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 1.6;

  if (e.kind === "bit") {
    roundRect(ctx, -e.radius, -e.radius * 0.7, e.radius * 2, e.radius * 1.4, 3);
    ctx.fill();
    ctx.stroke();
  } else if (e.kind === "runner") {
    ctx.beginPath();
    ctx.moveTo(e.radius + 4, 0);
    ctx.lineTo(-e.radius, -e.radius);
    ctx.lineTo(-e.radius * 0.4, 0);
    ctx.lineTo(-e.radius, e.radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.kind === "tank") {
    const s = e.radius;
    roundRect(ctx, -s, -s * 0.7, s * 2, s * 1.4, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5a6578";
    ctx.fillRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7);
  } else if (e.kind === "overlord") {
    const s = e.radius;
    roundRect(ctx, -s, -s * 0.62, s * 2.1, s * 1.24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = def.color2;
    roundRect(ctx, -s * 0.15, -s * 0.42, s * 1.05, s * 0.84, 3);
    ctx.fill();
    ctx.fillStyle = "#fff1b0";
    ctx.beginPath();
    ctx.moveTo(s * 0.15, -s * 0.55);
    ctx.lineTo(s * 0.45, -s * 0.2);
    ctx.lineTo(-s * 0.15, -s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffd0d6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s * 0.55, 0, s * 0.28, 0, Math.PI * 2);
    ctx.stroke();
  } else if (e.kind === "swarm") {
    ctx.beginPath();
    ctx.arc(-3, -2, 4, 0, Math.PI * 2);
    ctx.arc(3, 1, 3.2, 0, Math.PI * 2);
    ctx.arc(0, 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === "wraith") {
    ctx.globalAlpha = 0.72 + 0.15 * Math.sin(time * 6 + e.id);
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius, e.radius * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-16, -10, -22, 2);
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-16, 10, -22, -2);
    ctx.stroke();
  } else if (e.kind === "hex") {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + time * 0.5;
      const px = Math.cos(a) * e.radius;
      const py = Math.sin(a) * e.radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    roundRect(ctx, -e.radius, -e.radius * 0.7, e.radius * 1.8, e.radius * 1.4, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(4, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const ratio = Math.max(0, e.hp / e.maxHp);
  const bw = e.kind === "overlord" ? e.radius * 2.6 : e.radius * 2.2;
  const bh = e.kind === "overlord" ? 6 : 3;
  const barY = e.y - e.radius - (e.kind === "overlord" ? 16 : 10);
  if (e.kind === "overlord") {
    ctx.font = "800 10px Oxanium, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd0d6";
    ctx.fillText("SOBERANO", e.x, barY - 4);
  }
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(e.x - bw / 2, barY, bw, bh);
  ctx.fillStyle = ratio > 0.5 ? "#7dffc3" : ratio > 0.25 ? "#ffe36a" : "#ff4d6d";
  ctx.fillRect(e.x - bw / 2, barY, bw * ratio, bh);
}

function drawProjectiles(ctx: CanvasRenderingContext2D, w: World): void {
  for (const p of w.projs) {
    glow(ctx, p.x, p.y, p.kind === "missile" ? 16 : 10, p.color, 0.55);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.fillStyle = p.color;
    if (p.kind === "missile") {
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-8, 4);
      ctx.fill();
    } else if (p.kind === "frost") {
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(0, 5);
      ctx.lineTo(-6, 0);
      ctx.lineTo(0, -5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const b of w.bolts) {
    ctx.strokeStyle = hexAlpha(b.color, 0.25 + (b.life / b.max) * 0.8);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(b.pts[0]!.x, b.pts[0]!.y);
    for (let i = 1; i < b.pts.length; i++) {
      const a = b.pts[i - 1]!;
      const c = b.pts[i]!;
      const mx = (a.x + c.x) / 2 + (hash(i + b.life * 40) - 0.5) * 18;
      const my = (a.y + c.y) / 2 + (hash(i + 9) - 0.5) * 18;
      ctx.quadraticCurveTo(mx, my, c.x, c.y);
    }
    ctx.stroke();
  }
  for (const b of w.beams) {
    ctx.strokeStyle = hexAlpha(b.color, 0.85);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = hexAlpha(b.color, 0.18);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, w: World): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of w.particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.kind === "ring") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.2 - a), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.kind === "smoke" ? a : 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.font = "700 11px Oxanium, sans-serif";
  ctx.textAlign = "center";
  for (const f of w.floaters) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawGhost(ctx: CanvasRenderingContext2D, w: World): void {
  if (!w.placing || !w.hover || w.mode !== "playing") return;
  const { c, r } = w.hover;
  const ok = canBuild(w, c, r) && w.gold >= TOWERS[w.placing].cost;
  const def = TOWERS[w.placing];
  const x = (c + 0.5) * TILE;
  const y = (r + 0.5) * TILE;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = ok ? def.color : "#ff4d6d";
  ctx.beginPath();
  ctx.arc(x, y, def.range[0]!, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = ok ? def.color : "#ff4d6d";
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(x, y, def.range[0]!, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, w: World): void {
  if (!w.showGrid && !w.placing) return;
  ctx.strokeStyle = "rgba(120,180,210,0.12)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * TILE, 0);
    ctx.lineTo(c * TILE, WORLD_H);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * TILE);
    ctx.lineTo(WORLD_W, r * TILE);
    ctx.stroke();
  }
}

function drawMinimap(ctx: CanvasRenderingContext2D, w: World): void {
  const mw = 168;
  const mh = (mw * WORLD_H) / WORLD_W;
  const x = WORLD_W - mw - 12;
  const y = 12;
  ctx.fillStyle = "rgba(6,10,16,0.72)";
  roundRect(ctx, x - 6, y - 6, mw + 12, mh + 12, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(92,225,255,0.25)";
  ctx.stroke();
  const sx = mw / WORLD_W;
  const sy = mh / WORLD_H;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(92,225,255,0.5)";
  ctx.lineWidth = 2;
  for (const lane of w.map.lanes) {
    ctx.beginPath();
    ctx.moveTo(lane[0]!.x * sx, lane[0]!.y * sy);
    for (let i = 1; i < lane.length; i++) ctx.lineTo(lane[i]!.x * sx, lane[i]!.y * sy);
    ctx.stroke();
  }
  ctx.fillStyle = "#5ce1ff";
  ctx.beginPath();
  ctx.arc(w.map.core.x * sx, w.map.core.y * sy, 4, 0, Math.PI * 2);
  ctx.fill();
  for (const t of w.towers) {
    ctx.fillStyle = TOWERS[t.kind].color;
    ctx.fillRect(t.x * sx - 1.5, t.y * sy - 1.5, 3, 3);
  }
  for (const e of w.enemies) {
    ctx.fillStyle = ENEMIES[e.kind].color;
    ctx.fillRect(e.x * sx - 1, e.y * sy - 1, 2, 2);
  }
  ctx.restore();
}

function drawBanners(ctx: CanvasRenderingContext2D, w: World): void {
  const b = w.banners[w.banners.length - 1];
  if (!b) return;
  const a = Math.min(1, b.life * 2, 1);
  ctx.save();
  ctx.globalAlpha = Math.min(1, a, b.life);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(5,10,16,0.55)";
  roundRect(ctx, WORLD_W / 2 - 240, 36, 480, 58, 10);
  ctx.fill();
  ctx.fillStyle = "#eaf6ff";
  ctx.font = "800 18px Oxanium, sans-serif";
  ctx.fillText(b.title, WORLD_W / 2, 60);
  ctx.fillStyle = "#8fb0c8";
  ctx.font = "500 12px Outfit, sans-serif";
  ctx.fillText(b.sub, WORLD_W / 2, 80);
  ctx.restore();
}

export function renderWorld(ctx: CanvasRenderingContext2D, w: World): void {
  const dpr = w.dpr || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);
  const shakeX = (hash(w.elapsed * 40) - 0.5) * w.shake * 16;
  const shakeY = (hash(w.elapsed * 40 + 5) - 0.5) * w.shake * 16;
  ctx.setTransform(dpr, 0, 0, dpr, shakeX * dpr, shakeY * dpr);
  drawBackground(ctx, w.elapsed);
  drawTiles(ctx, w, w.elapsed);
  drawCoverage(ctx, w);
  drawGrid(ctx, w);
  drawCore(ctx, w, w.elapsed);
  for (const t of w.towers) drawTower(ctx, t, t.id === w.selected, w.elapsed, w);
  const grounded = w.enemies.filter((e) => !e.flying);
  const flying = w.enemies.filter((e) => e.flying);
  for (const e of grounded) drawEnemy(ctx, e, w.elapsed);
  drawProjectiles(ctx, w);
  for (const e of flying) drawEnemy(ctx, e, w.elapsed);
  drawParticles(ctx, w);
  drawGhost(ctx, w);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawMinimap(ctx, w);
  drawBanners(ctx, w);
  if (w.flash > 0) {
    ctx.fillStyle = `rgba(255,40,70,${w.flash * 0.28})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  if (w.combo >= 6) {
    ctx.fillStyle = "#ffe36a";
    ctx.font = "800 14px Oxanium, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`COMBO ×${w.combo}`, 16, WORLD_H - 16);
  }
}
