import {
  MAX_WAVES_CAMPAIGN,
  SELL_RATIO,
  TARGET_LABEL,
  TOWER_ORDER,
  TOWERS,
  upgradeCost,
  type TowerId,
} from "./data";
import type { AudioSys } from "./audio";
import { selectedTower, type World } from "./sim";

export type HudHandles = {
  root: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  setPlacing: (id: TowerId | null) => void;
  onStart: () => void;
  onHelp: (open: boolean) => void;
  onMute: () => void;
  onCall: () => void;
  onPause: () => void;
  onSpeed: (n: 0 | 1 | 2 | 3) => void;
  onUpgrade: () => void;
  onSell: () => void;
  onMode: () => void;
  onContinue: () => void;
  onMenu: () => void;
};

export function mountHud(app: HTMLElement, audio: AudioSys): HudHandles {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <span class="logo-mark"></span>
          <div>
            <strong>NEXUS</strong>
            <em>Última Linha</em>
          </div>
        </div>
        <div class="meters">
          <div class="meter gold"><span>Ouro</span><b id="m-gold">0</b></div>
          <div class="meter lives"><span>Núcleo</span><b id="m-lives">0</b></div>
          <div class="meter wave"><span>Onda</span><b id="m-wave">0</b></div>
          <div class="meter score"><span>Pontos</span><b id="m-score">0</b></div>
        </div>
        <div class="top-actions">
          <button class="chip" id="btn-call" title="Antecipar onda (N)">Antecipar</button>
          <button class="chip" id="btn-pause" title="Pausar (Espaço)">Pausar</button>
          <div class="speed">
            <button data-spd="1">1×</button>
            <button data-spd="2">2×</button>
            <button data-spd="3">3×</button>
          </div>
          <button class="icon-btn" id="btn-mute" title="Som (M)">♫</button>
          <button class="icon-btn" id="btn-help" title="Ajuda (H)">?</button>
        </div>
      </header>

      <div class="workspace">
        <div class="stage-col">
          <div class="stage-frame" id="stage">
            <canvas id="game"></canvas>
            <div class="hud-corners" aria-hidden="true"></div>
            <p class="hint" id="hint"></p>
          </div>
        </div>
        <aside class="inspect" id="inspect">
          <p class="inspect-empty">Selecione uma torre no mapa para ver upgrades, venda e modo de alvo.</p>
        </aside>
      </div>

      <footer class="dock">
        <div class="cards" id="cards"></div>
        <p class="dock-help">Atalhos: <kbd>1–7</kbd> torres · <kbd>U</kbd> upgrade · <kbd>X</kbd> vender · <kbd>T</kbd> alvo · <kbd>G</kbd> grade · <kbd>C</kbd> cobertura · <kbd>Esc</kbd> cancelar</p>
      </footer>

      <div class="overlay" id="ov-menu">
        <div class="panel hero">
          <p class="eyebrow">demonstração cursor · tower defense</p>
          <h1>NEXUS</h1>
          <h2>Última Linha</h2>
          <p class="lead">Duas pistas de invasores correm rumo ao núcleo. Sete torres, chefes a cada dez ondas, áudio sintético, partículas e uma campanha de 30 ondas — depois o infinito.</p>
          <div class="hero-stats">
            <div><b>7</b><span>torres</span></div>
            <div><b>8</b><span>inimigos</span></div>
            <div><b>30+</b><span>ondas</span></div>
            <div><b id="best-score">0</b><span>recorde</span></div>
          </div>
          <div class="hero-actions">
            <button class="btn primary" id="btn-start">Iniciar defesa</button>
            <button class="btn ghost" id="btn-how">Como jogar</button>
          </div>
        </div>
      </div>

      <div class="overlay hidden" id="ov-help">
        <div class="panel help">
          <h3>Como defender o núcleo</h3>
          <ol>
            <li>Escolha uma torre na barra de baixo (ou teclas 1–7) e clique num quadrado livre.</li>
            <li>O caminho brilhante é a pista: ali ninguém constrói. Prefira curvas e o ponto em que as pistas se aproximam.</li>
            <li>Clique numa torre já construída para melhorar (U) ou vender (X). Troque o alvo com T: primeiro, último, mais forte ou mais perto.</li>
            <li>Espectros voam — Pulso quase não os alcança. Use Lança, Arco, Crio, Míssil ou Prisma.</li>
            <li>Farol não atira: ele deixa as torres vizinhas mais rápidas e com mais alcance.</li>
            <li>Antecipar a onda (N) dá ouro extra. Sobreviva 30 ondas para vencer a campanha.</li>
          </ol>
          <button class="btn primary" id="btn-help-close">Entendi</button>
        </div>
      </div>

      <div class="overlay hidden" id="ov-pause">
        <div class="panel">
          <h3>Sinal pausado</h3>
          <p>O campo está congelado. Espaço retoma.</p>
          <button class="btn primary" id="btn-resume">Continuar</button>
          <button class="btn ghost" id="btn-to-menu">Menu inicial</button>
        </div>
      </div>

      <div class="overlay hidden" id="ov-end">
        <div class="panel">
          <h3 id="end-title">Núcleo rompido</h3>
          <p id="end-sub"></p>
          <div class="end-grid">
            <div><b id="end-score">0</b><span>pontos</span></div>
            <div><b id="end-wave">0</b><span>onda</span></div>
            <div><b id="end-kills">0</b><span>abates</span></div>
            <div><b id="end-best">0</b><span>recorde</span></div>
          </div>
          <div class="hero-actions">
            <button class="btn primary" id="btn-retry">Nova tentativa</button>
            <button class="btn ghost hidden" id="btn-endless">Seguir no infinito</button>
            <button class="btn ghost" id="btn-end-menu">Menu</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const cards = app.querySelector("#cards")!;
  cards.innerHTML = TOWER_ORDER.map((id) => {
    const d = TOWERS[id];
    return `<button class="card" data-tower="${id}" title="${d.blurb}">
      <i class="swatch" style="--c:${d.color}"></i>
      <span class="k">${d.hotkey}</span>
      <strong>${d.name}</strong>
      <em>${d.cost}</em>
    </button>`;
  }).join("");

  const canvas = app.querySelector<HTMLCanvasElement>("#game")!;
  const stage = app.querySelector<HTMLElement>("#stage")!;

  const handles: HudHandles = {
    root: app,
    stage,
    canvas,
    setPlacing: () => {},
    onStart: () => {},
    onHelp: () => {},
    onMute: () => {},
    onCall: () => {},
    onPause: () => {},
    onSpeed: () => {},
    onUpgrade: () => {},
    onSell: () => {},
    onMode: () => {},
    onContinue: () => {},
    onMenu: () => {},
  };

  app.querySelector("#btn-start")!.addEventListener("click", () => handles.onStart());
  app.querySelector("#btn-how")!.addEventListener("click", () => handles.onHelp(true));
  app.querySelector("#btn-help")!.addEventListener("click", () => handles.onHelp(true));
  app.querySelector("#btn-help-close")!.addEventListener("click", () => handles.onHelp(false));
  app.querySelector("#btn-mute")!.addEventListener("click", () => handles.onMute());
  app.querySelector("#btn-call")!.addEventListener("click", () => handles.onCall());
  app.querySelector("#btn-pause")!.addEventListener("click", () => handles.onPause());
  app.querySelector("#btn-resume")!.addEventListener("click", () => handles.onPause());
  app.querySelector("#btn-to-menu")!.addEventListener("click", () => handles.onMenu());
  app.querySelector("#btn-retry")!.addEventListener("click", () => handles.onStart());
  app.querySelector("#btn-endless")!.addEventListener("click", () => handles.onContinue());
  app.querySelector("#btn-end-menu")!.addEventListener("click", () => handles.onMenu());
  app.querySelectorAll<HTMLButtonElement>("[data-spd]").forEach((b) => {
    b.addEventListener("click", () => handles.onSpeed(Number(b.dataset.spd) as 1 | 2 | 3));
  });
  app.querySelectorAll<HTMLButtonElement>("[data-tower]").forEach((b) => {
    b.addEventListener("click", () => handles.setPlacing(b.dataset.tower as TowerId));
  });

  void audio;
  return handles;
}

export function syncHud(h: HudHandles, w: World, audio: AudioSys): void {
  const $ = (id: string) => h.root.querySelector(id)!;
  $("#m-gold").textContent = String(Math.floor(w.gold));
  $("#m-lives").textContent = String(Math.max(0, w.lives));
  $("#m-wave").textContent = String(w.wave);
  $("#m-score").textContent = String(w.score);
  $("#hint").textContent = w.mode === "playing" ? w.hint : "";
  $("#best-score").textContent = String(w.best);

  h.root.querySelector("#btn-mute")!.classList.toggle("off", audio.muted);
  h.root.querySelector("#btn-call")!.classList.toggle("hidden", w.mode !== "playing" || w.activeWave);
  h.root.querySelector("#btn-pause")!.textContent = w.mode === "paused" ? "Retomar" : "Pausar";

  h.root.querySelectorAll<HTMLButtonElement>("[data-spd]").forEach((b) => {
    b.classList.toggle("on", Number(b.dataset.spd) === w.speed);
  });
  h.root.querySelectorAll<HTMLButtonElement>("[data-tower]").forEach((b) => {
    const id = b.dataset.tower as TowerId;
    b.classList.toggle("on", w.placing === id);
    b.classList.toggle("poor", w.gold < TOWERS[id].cost);
  });

  $("#ov-menu").classList.toggle("hidden", w.mode !== "menu");
  $("#ov-pause").classList.toggle("hidden", w.mode !== "paused");
  const end = w.mode === "defeat" || w.mode === "victory";
  $("#ov-end").classList.toggle("hidden", !end);
  if (end) {
    $("#end-title").textContent = w.mode === "victory" ? "Protocolo contido" : "Núcleo rompido";
    $("#end-sub").textContent =
      w.mode === "victory"
        ? `Você segurou ${MAX_WAVES_CAMPAIGN} ondas. Pode parar aqui ou testar o overflow infinito.`
        : `A linha caiu na onda ${w.wave}. Dano causado: ${Math.round(w.stats.dmg)}. Vazamentos: ${w.stats.leaked}.`;
    $("#end-score").textContent = String(w.score);
    $("#end-wave").textContent = String(w.wave);
    $("#end-kills").textContent = String(w.kills);
    $("#end-best").textContent = String(w.best);
    $("#btn-endless").classList.toggle("hidden", w.mode !== "victory");
  }

  const box = h.root.querySelector("#inspect") as HTMLElement;
  const t = selectedTower(w);
  if (!t || w.mode === "menu") {
    box.innerHTML = `<p class="inspect-empty">Selecione uma torre no mapa para ver upgrades, venda e modo de alvo.</p>`;
    delete box.dataset.towerId;
    return;
  }
  const def = TOWERS[t.kind];
  const up = t.tier < 3 ? upgradeCost(def, t.tier) : 0;
  const sell = Math.round(t.spent * SELL_RATIO);
  const html = `
    <p class="tag">${def.name} · Nível ${t.tier}</p>
    <h3>${def.name}</h3>
    <p class="blurb">${def.blurb}</p>
    <ul class="stats">
      <li><span>Alcance</span><b>${def.range[t.tier - 1]}</b></li>
      <li><span>Dano</span><b>${def.damage[t.tier - 1]}</b></li>
      <li><span>Cadência</span><b>${def.rate[t.tier - 1]}/s</b></li>
      <li><span>Extra</span><b>${def.extra}</b></li>
    </ul>
    <p class="mode">Alvo: <strong>${TARGET_LABEL[t.mode]}</strong></p>
    <div class="inspect-actions">
      <button class="btn primary" id="up" ${t.tier >= 3 || w.gold < up ? "disabled" : ""}>${t.tier >= 3 ? "Máximo" : `Upgrade ${up}`}</button>
      <button class="btn ghost" id="md">Trocar alvo</button>
      <button class="btn danger" id="sl">Vender ${sell}</button>
    </div>
  `;
  if (box.dataset.towerId === String(t.id)) {
    const upBtn = box.querySelector("#up") as HTMLButtonElement | null;
    if (upBtn) {
      upBtn.disabled = t.tier >= 3 || w.gold < up;
      upBtn.textContent = t.tier >= 3 ? "Máximo" : `Upgrade ${up}`;
    }
    const sl = box.querySelector("#sl");
    if (sl) sl.textContent = `Vender ${sell}`;
    const md = box.querySelector(".mode strong");
    if (md) md.textContent = TARGET_LABEL[t.mode];
    return;
  }
  box.innerHTML = html;
  box.dataset.towerId = String(t.id);
  box.querySelector("#up")?.addEventListener("click", () => h.onUpgrade());
  box.querySelector("#md")?.addEventListener("click", () => h.onMode());
  box.querySelector("#sl")?.addEventListener("click", () => h.onSell());
}

export function setHelp(h: HudHandles, open: boolean): void {
  h.root.querySelector("#ov-help")!.classList.toggle("hidden", !open);
}
