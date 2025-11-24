
// Math classes
export class Vector3 extends Array<number> {
  constructor(x = 0, y = x, z = x) {
    super(x, y, z);
  }
  get x() { return this[0] ?? 0; }
  get y() { return this[1] ?? 0; }
  get z() { return this[2] ?? 0; }
  set x(v: number) { this[0] = v; }
  set y(v: number) { this[1] = v; }
  set z(v: number) { this[2] = v; }

  set(x: number, y: number = x, z: number = x) {
    this[0] = x;
    this[1] = y;
    this[2] = z;
    return this;
  }
  
  copy(v: Vector3 | number[]) {
    this[0] = v[0] ?? 0;
    this[1] = v[1] ?? 0;
    this[2] = v[2] ?? 0;
    return this;
  }
}

// Tweening class from reference (lt)
export class Tween {
  currentValue: number;
  targetValue: number;
  elapsedTime: number;
  duration: number;
  formatter?: (v: number) => number;

  constructor(current: number, target: number, duration: number, formatter?: (v: number) => number) {
    this.currentValue = current;
    this.targetValue = target;
    this.duration = duration;
    this.elapsedTime = 0;
    if (formatter) {
        this.formatter = formatter;
    }
  }

  get value() {
    return this.formatter ? this.formatter(this.currentValue) : this.currentValue;
  }

  update(target: number) {
    this.targetValue = target;
    this.elapsedTime = 0;
  }

  next(dt: number) {
    const progress = Math.min(Math.max(this.elapsedTime / this.duration, 0), 1);
    this.elapsedTime += dt;
    this.currentValue = this.currentValue + (this.targetValue - this.currentValue) * progress;
    return this.currentValue;
  }
}

// Hue management class from reference (dt)
export class Hue {
  useDefaultHue = false;
  topStart: Tween;
  topEnd: Tween;
  middleStart: Tween;
  middleEnd: Tween;
  bottomStart: Tween;
  bottomEnd: Tween;

  constructor(hue = 10) {
    const parts = this.createParts(hue);
    // Ensure parts has 6 elements
    const [bS, mS, tS, bE, mE, tE] = parts;
    this.topStart = new Tween(tS ?? 0, tS ?? 0, 3000);
    this.topEnd = new Tween(tE ?? 0, tE ?? 0, 3000);
    this.middleStart = new Tween(mS ?? 0, mS ?? 0, 3000);
    this.middleEnd = new Tween(mE ?? 0, mE ?? 0, 3000);
    this.bottomStart = new Tween(bS ?? 0, bS ?? 0, 3000);
    this.bottomEnd = new Tween(bE ?? 0, bE ?? 0, 3000);
  }

  createParts(hue: number): number[] {
    // Helper functions from reference
    const normalizeHue = (h: number) => (h + 280) % 360;
    const shiftHue = (h: number) => {
        const shifted = h + (30 + Math.random() * 10); 
        return (shifted >= 280 && shifted < 360) ? shifted % 360 : shifted;
    };

    const base = normalizeHue(hue);
    const shiftedBase = shiftHue(base);
    
    return [base, 300, 50, shiftedBase, 320, 50]; 
  }

  static hueToRgb(hue: number, s: number, l: number): [number, number, number] {
    const k = (n: number) => (n + hue / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)];
  }
}

export class ColorTween {
  r: Tween;
  g: Tween;
  b: Tween;

  constructor(hue: number) {
    const [r, g, b] = Hue.hueToRgb(hue, 1, 0.5);
    this.r = new Tween(r, r, 3000);
    this.g = new Tween(g, g, 3000);
    this.b = new Tween(b, b, 3000);
  }

  update(hue: number) {
    const [r, g, b] = Hue.hueToRgb(hue, 1, 0.5);
    this.r.update(r);
    this.g.update(g);
    this.b.update(b);
  }

  next(dt: number) {
    this.r.next(dt);
    this.g.next(dt);
    this.b.next(dt);
  }

  get value(): [number, number, number] {
    return [this.r.value, this.g.value, this.b.value];
  }
}

export class PaletteManager {
  parts: ColorTween[];
  useDefaultHue = false;

  constructor(hue = 10) {
    this.parts = this.createParts(hue);
  }

  createParts(hue: number) {
    const normalizeHue = (h: number) => (h + 280) % 360;
    const shiftHue = (h: number) => {
        const shifted = h + (30 + Math.random() * 10); 
        return (shifted >= 280 && shifted < 360) ? shifted % 360 : shifted;
    };
    const base = normalizeHue(hue);
    const shifted = shiftHue(base);

    return [
      new ColorTween(base),
      new ColorTween(300),
      new ColorTween(50),
      new ColorTween(shifted),
      new ColorTween(320),
      new ColorTween(50)
    ];
  }

  update(hue: number, collectionHue?: number, explicitColors?: [number, number, number][]) {
    if (explicitColors && explicitColors.length > 0) {
        for (let i = 0; i < 6; i++) {
            const color = explicitColors[i % explicitColors.length];
            const part = this.parts[i];
            if (part && color) {
                part.r.update(color[0]);
                part.g.update(color[1]);
                part.b.update(color[2]);
            }
        }
        return;
    }

    const normalizeHue = (h: number) => (h + 280) % 360;
    const base = normalizeHue(hue);
    const colBase = collectionHue !== undefined ? normalizeHue(collectionHue) : base;

    const i = base;
    const s = (i + 40 + Math.random() * 40) % 360; // middle
    const r = colBase;

    if (this.parts[0]) this.parts[0].update(r);
    if (this.parts[1]) this.parts[1].update(s);
    if (this.parts[2]) this.parts[2].update(i);
    if (this.parts[3]) this.parts[3].update((r + 35) % 360);
    if (this.parts[4]) this.parts[4].update((s + 35) % 360);
    if (this.parts[5]) this.parts[5].update((i + 35) % 360);
  }

  next(dt: number) {
    this.parts.forEach(p => p.next(dt));
  }

  get value() {
    return this.parts.map(p => p.value);
  }
}
