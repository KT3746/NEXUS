import { COLS, CORE_CELLS, DECOR, LANES, ROWS, TILE, type TileKind } from "./data";
import { dist, type V } from "./math";

export type MapData = {
  tiles: TileKind[][];
  lanes: V[][];
  core: V;
};

function paintLine(tiles: TileKind[][], ax: number, ay: number, bx: number, by: number): void {
  const steps = Math.max(1, Math.ceil(dist(ax, ay, bx, by) * 4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    for (let dc = -0.12; dc <= 0.12; dc += 0.12) {
      for (let dr = -0.12; dr <= 0.12; dr += 0.12) {
        const cc = Math.round(x + dc);
        const rr = Math.round(y + dr);
        if (cc >= 0 && rr >= 0 && cc < COLS && rr < ROWS && tiles[rr]![cc] !== "core") {
          tiles[rr]![cc] = "path";
        }
      }
    }
  }
}

export function buildMap(): MapData {
  const tiles: TileKind[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: TileKind[] = [];
    for (let c = 0; c < COLS; c++) {
      const border = r === 0 || r === ROWS - 1 || c === COLS - 1;
      row.push(border ? "block" : "build");
    }
    tiles.push(row);
  }

  for (const [c, r] of CORE_CELLS) {
    tiles[r]![c] = "core";
  }

  const lanes: V[][] = LANES.map((lane) =>
    lane.map((p) => ({ x: (p.x + 0.5) * TILE, y: (p.y + 0.5) * TILE })),
  );

  for (const lane of LANES) {
    for (let i = 1; i < lane.length; i++) {
      paintLine(tiles, lane[i - 1]!.x, lane[i - 1]!.y, lane[i]!.x, lane[i]!.y);
    }
  }

  for (const lane of LANES) {
    const start = lane[0]!;
    const r = Math.round(start.y);
    if (r >= 0 && r < ROWS) {
      tiles[r]![0] = "spawn";
      if (1 < COLS && tiles[r]![1] !== "core") tiles[r]![1] = "path";
    }
  }

  for (const [c, r] of DECOR) {
    if (r >= 0 && c >= 0 && r < ROWS && c < COLS && tiles[r]![c] === "build") {
      tiles[r]![c] = "block";
    }
  }

  return {
    tiles,
    lanes,
    core: { x: 20.2 * TILE, y: 6.5 * TILE },
  };
}

export function samplePath(lane: V[], distPx: number): { pos: V; ang: number; done: boolean } {
  if (distPx <= 0) {
    const a = lane[0]!;
    const b = lane[1] ?? a;
    return { pos: { x: a.x, y: a.y }, ang: Math.atan2(b.y - a.y, b.x - a.x), done: false };
  }
  let left = distPx;
  for (let i = 1; i < lane.length; i++) {
    const a = lane[i - 1]!;
    const b = lane[i]!;
    const seg = dist(a.x, a.y, b.x, b.y);
    if (left <= seg) {
      const t = seg === 0 ? 0 : left / seg;
      return {
        pos: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
        ang: Math.atan2(b.y - a.y, b.x - a.x),
        done: false,
      };
    }
    left -= seg;
  }
  const last = lane[lane.length - 1]!;
  const prev = lane[lane.length - 2] ?? last;
  return {
    pos: { x: last.x, y: last.y },
    ang: Math.atan2(last.y - prev.y, last.x - prev.x),
    done: true,
  };
}

export function tileAt(mx: number, my: number): { c: number; r: number } {
  return { c: Math.floor(mx / TILE), r: Math.floor(my / TILE) };
}

export function inBounds(c: number, r: number): boolean {
  return c >= 0 && r >= 0 && c < COLS && r < ROWS;
}
