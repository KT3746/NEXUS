const LS_MUTE = "nexus-mute";
const LS_VOL = "nexus-vol";

export class AudioSys {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  muted = localStorage.getItem(LS_MUTE) === "1";
  volume = Number(localStorage.getItem(LS_VOL) ?? "0.55");
  amb: { stop: () => void } | null = null;
  unlocked = false;

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.ctx.destination);
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.unlocked = true;
    this.startAmbient();
  }

  setMuted(v: boolean): void {
    this.muted = v;
    localStorage.setItem(LS_MUTE, v ? "1" : "0");
    if (this.master) this.master.gain.value = v ? 0 : this.volume;
  }

  setVolume(v: number): void {
    this.volume = v;
    localStorage.setItem(LS_VOL, String(v));
    if (this.master && !this.muted) this.master.gain.value = v;
  }

  private env(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slide = 0,
  ): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, gain: number, hp = 800): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, (this.ctx.sampleRate * dur) | 0);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur);
  }

  place(): void {
    this.env(420, 0.12, "triangle", 0.12);
    this.env(840, 0.16, "sine", 0.06, 200);
  }
  upgrade(): void {
    this.env(520, 0.1, "square", 0.06);
    this.env(780, 0.18, "triangle", 0.08, 400);
  }
  sell(): void {
    this.env(300, 0.14, "sawtooth", 0.05, -120);
  }
  shoot(kind: string): void {
    if (kind === "pulse") this.env(180, 0.08, "square", 0.05, -80);
    else if (kind === "frost") this.env(920, 0.07, "sine", 0.04, 200);
    else if (kind === "arc") {
      this.noise(0.07, 0.07, 1800);
      this.env(1400, 0.05, "square", 0.03);
    } else if (kind === "lance") {
      this.env(240, 0.12, "sawtooth", 0.07, 900);
      this.noise(0.05, 0.04, 2400);
    } else if (kind === "missile") this.env(90, 0.16, "sawtooth", 0.06, -40);
    else if (kind === "prism") this.env(660, 0.04, "sine", 0.02);
  }
  hit(): void {
    this.env(210, 0.05, "square", 0.03, -60);
  }
  death(big = false): void {
    this.noise(big ? 0.35 : 0.14, big ? 0.16 : 0.08, big ? 200 : 600);
    this.env(big ? 70 : 140, big ? 0.4 : 0.16, "triangle", 0.08, -50);
  }
  leak(): void {
    this.env(90, 0.28, "sawtooth", 0.1, -40);
    this.noise(0.2, 0.08, 300);
  }
  wave(): void {
    this.env(196, 0.22, "triangle", 0.08);
    this.env(392, 0.3, "sine", 0.05, 80);
  }
  win(): void {
    this.env(523, 0.2, "triangle", 0.08);
    this.env(659, 0.28, "sine", 0.07);
    this.env(784, 0.4, "sine", 0.06);
  }
  lose(): void {
    this.env(180, 0.5, "sawtooth", 0.1, -100);
    this.env(90, 0.7, "triangle", 0.08, -40);
  }
  ui(): void {
    this.env(640, 0.05, "sine", 0.04);
  }

  startAmbient(): void {
    if (!this.ctx || !this.master || this.amb) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const make = (freq: number, type: OscillatorType, gain: number, detune: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      f.type = "lowpass";
      f.frequency.value = 420;
      g.gain.value = gain;
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.07 + Math.random() * 0.05;
      lg.gain.value = 180;
      lfo.connect(lg).connect(f.frequency);
      o.connect(f).connect(g).connect(this.master!);
      o.start(t0);
      lfo.start(t0);
      return () => {
        o.stop();
        lfo.stop();
      };
    };
    const stops = [
      make(55, "sine", 0.035, 0),
      make(82.4, "triangle", 0.02, 6),
      make(164.8, "sine", 0.012, -4),
    ];
    this.amb = {
      stop: () => {
        for (const s of stops) s();
        this.amb = null;
      },
    };
  }
}
