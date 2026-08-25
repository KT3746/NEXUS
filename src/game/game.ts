import { AudioSys } from "./audio";
import { TOWER_ORDER, type TowerId } from "./data";
import { WORLD_H, WORLD_W } from "./data";
import { renderWorld } from "./render";
import {
  callWave,
  canBuild,
  continueEndless,
  createWorld,
  cycleMode,
  hoverFromWorld,
  placeTower,
  selectedTower,
  startRun,
  tickWorld,
  trySell,
  tryUpgrade,
  worldFromPointer,
  type World,
} from "./sim";
import { mountHud, setHelp, syncHud, type HudHandles } from "./hud";

export class Game {
  world: World;
  audio: AudioSys;
  hud: HudHandles;
  ctx: CanvasRenderingContext2D | null = null;
  help = false;
  last = 0;
  running = false;

  constructor(app: HTMLElement) {
    this.world = createWorld();
    this.audio = new AudioSys();
    this.hud = mountHud(app, this.audio);
    this.bind();
    this.fit();
    requestAnimationFrame(() => this.fit());
    window.addEventListener("resize", () => this.fit());
    new ResizeObserver(() => this.fit()).observe(this.hud.stage);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      tickWorld(this.world, dt, this.audio);
      if (this.ctx) renderWorld(this.ctx, this.world);
      syncHud(this.hud, this.world, this.audio);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  fit(): void {
    const canvas = this.hud.canvas;
    const stage = this.hud.stage;
    const pad = 8;
    const availW = Math.max(320, stage.clientWidth - pad);
    const availH = Math.max(240, stage.clientHeight - pad);
    const scale = Math.min(availW / WORLD_W, availH / WORLD_H);
    const cssW = Math.floor(WORLD_W * scale);
    const cssH = Math.floor(WORLD_H * scale);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.floor(WORLD_W * dpr);
    canvas.height = Math.floor(WORLD_H * dpr);
    this.world.dpr = dpr;
    this.ctx = canvas.getContext("2d");
    if (this.ctx) this.ctx.imageSmoothingEnabled = true;
  }

  private bind(): void {
    const h = this.hud;
    h.onStart = () => {
      void this.audio.unlock();
      this.help = false;
      setHelp(h, false);
      startRun(this.world);
    };
    h.onHelp = (open) => {
      this.help = open;
      setHelp(h, open);
      this.audio.ui();
    };
    h.onMute = () => {
      void this.audio.unlock();
      this.audio.setMuted(!this.audio.muted);
      this.audio.ui();
    };
    h.onCall = () => {
      void this.audio.unlock();
      callWave(this.world, this.audio);
    };
    h.onPause = () => this.togglePause();
    h.onSpeed = (n) => {
      if (this.world.mode === "playing") this.world.speed = n;
    };
    h.onUpgrade = () => tryUpgrade(this.world, this.audio);
    h.onSell = () => trySell(this.world, this.audio);
    h.onMode = () => {
      const t = selectedTower(this.world);
      if (t) {
        cycleMode(t);
        this.audio.ui();
      }
    };
    h.onContinue = () => continueEndless(this.world);
    h.onMenu = () => {
      const dpr = this.world.dpr;
      this.world = createWorld();
      this.world.dpr = dpr;
      this.help = false;
      setHelp(h, false);
    };
    h.setPlacing = (id) => this.setPlacing(id);

    const canvas = h.canvas;
    const move = (ev: PointerEvent) => {
      const pos = worldFromPointer(canvas, ev.clientX, ev.clientY);
      hoverFromWorld(this.world, pos);
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", (ev) => {
      void this.audio.unlock();
      move(ev);
      if (this.world.mode !== "playing") return;
      const hover = this.world.hover;
      if (!hover) return;
      if (ev.button === 2) {
        this.world.placing = null;
        this.world.selected = null;
        return;
      }
      const occ = this.world.towers.find((t) => t.c === hover.c && t.r === hover.r);
      if (occ) {
        this.world.selected = occ.id;
        this.world.placing = null;
        this.audio.ui();
        return;
      }
      if (this.world.placing) {
        if (!placeTower(this.world, this.world.placing, hover.c, hover.r, this.audio)) {
          if (!canBuild(this.world, hover.c, hover.r)) this.world.hint = "Não dá para construir neste quadrado.";
          else this.world.hint = "Ouro insuficiente.";
        }
        return;
      }
      this.world.selected = null;
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    window.addEventListener("keydown", (e) => {
      if (e.key === "h" || e.key === "H") {
        this.help = !this.help;
        setHelp(h, this.help);
        return;
      }
      if (e.key === "m" || e.key === "M") {
        h.onMute();
        return;
      }
      if (this.help && e.key === "Escape") {
        this.help = false;
        setHelp(h, false);
        return;
      }
      if (e.shiftKey && e.code === "Digit1") {
        this.world.speed = 1;
        return;
      }
      const digit = /^Digit([1-7])$/.exec(e.code);
      if (digit && this.world.mode === "playing") {
        this.setPlacing(TOWER_ORDER[Number(digit[1]) - 1]!);
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        this.togglePause();
        return;
      }
      if (e.key === "Escape") {
        this.world.placing = null;
        this.world.selected = null;
        return;
      }
      if (e.key === "u" || e.key === "U") tryUpgrade(this.world, this.audio);
      if (e.key === "x" || e.key === "X" || e.key === "Backspace") trySell(this.world, this.audio);
      if (e.key === "t" || e.key === "T") h.onMode();
      if (e.key === "g" || e.key === "G") this.world.showGrid = !this.world.showGrid;
      if (e.key === "c" || e.key === "C") this.world.showCoverage = !this.world.showCoverage;
      if (e.key === "n" || e.key === "N") callWave(this.world, this.audio);
      if (e.key === "+" || e.key === "=") this.world.speed = Math.min(3, (this.world.speed || 1) + 1) as 1 | 2 | 3;
      if (e.key === "-" || e.key === "_") {
        const s = this.world.speed || 1;
        this.world.speed = Math.max(1, s - 1) as 1 | 2 | 3;
      }
    });
  }

  private setPlacing(id: TowerId | null): void {
    if (this.world.mode !== "playing") return;
    if (id === null) {
      this.world.placing = null;
      return;
    }
    this.world.placing = this.world.placing === id ? null : id;
    this.world.selected = null;
    this.world.showGrid = true;
    this.audio.ui();
  }

  private togglePause(): void {
    if (this.world.mode === "playing") this.world.mode = "paused";
    else if (this.world.mode === "paused") this.world.mode = "playing";
  }
}
