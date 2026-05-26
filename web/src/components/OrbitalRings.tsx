import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;
const SIZE = 118;
const MARGIN = 10;

const R_OUTER = SIZE / 2 - MARGIN;        // ~49px
const R_INNER = R_OUTER * 0.37;           // ~18px

const OUTER_N        = 20;
const INNER_N        = 20;
const OUTER_DOT      = 3;                // radius px
const INNER_DOT      = 1.4;             // radius px

const OUTER_SPACING   = R_OUTER * 0.30;
const INNER_SPACING   = R_INNER * 0.30;
const OUTER_RING_MULTS = [-1.0, 0.0, 1.0] as const;
const INNER_RING_MULTS = [-1.5, -0.5, 0.5, 1.5] as const;

const T_OUTER_SPIN   = 6000;             // ms, forward
const T_INNER_SPIN   = 4500;             // ms, reverse
const T_PRECESS      = 13000;            // ms

const TILT_DEG       = 28;
const Z_DEG          = -90;
const PRECESS_CONE   = 22;               // degrees, half-angle
const DIHEDRAL_DEG   = 35;

// ─── 3×3 matrix helpers ───────────────────────────────────────────────────────
type M3 = [number,number,number,number,number,number,number,number,number];

function mul(a: M3, b: M3): M3 {
  return [
    a[0]*b[0]+a[3]*b[1]+a[6]*b[2], a[1]*b[0]+a[4]*b[1]+a[7]*b[2], a[2]*b[0]+a[5]*b[1]+a[8]*b[2],
    a[0]*b[3]+a[3]*b[4]+a[6]*b[5], a[1]*b[3]+a[4]*b[4]+a[7]*b[5], a[2]*b[3]+a[5]*b[4]+a[8]*b[5],
    a[0]*b[6]+a[3]*b[7]+a[6]*b[8], a[1]*b[6]+a[4]*b[7]+a[7]*b[8], a[2]*b[6]+a[5]*b[7]+a[8]*b[8],
  ];
}

function rotX(r: number): M3 { const c=Math.cos(r),s=Math.sin(r); return [1,0,0,0,c,s,0,-s,c]; }
function rotY(r: number): M3 { const c=Math.cos(r),s=Math.sin(r); return [c,0,-s,0,1,0,s,0,c]; }
function rotZ(r: number): M3 { const c=Math.cos(r),s=Math.sin(r); return [c,s,0,-s,c,0,0,0,1]; }

function applyM(m: M3, x: number, y: number, z: number): [number,number,number] {
  return [m[0]*x+m[3]*y+m[6]*z, m[1]*x+m[4]*y+m[7]*z, m[2]*x+m[5]*y+m[8]*z];
}

// Static matrices computed once
const M_STATIC   = mul(rotZ(Z_DEG * Math.PI/180), rotX(TILT_DEG * Math.PI/180));
const M_DIHEDRAL = mul(rotX(DIHEDRAL_DEG * Math.PI/180), rotZ(20 * Math.PI/180));

// ─── Dot descriptors ──────────────────────────────────────────────────────────
interface Dot { lx: number; ly: number; lz: number; isOuter: boolean; r: number; }

function buildDots(): Dot[] {
  const dots: Dot[] = [];
  for (let ri = 0; ri < 3; ri++) {
    const ax = OUTER_RING_MULTS[ri] * OUTER_SPACING;
    for (let di = 0; di < OUTER_N; di++) {
      const a = (TAU * di) / OUTER_N;
      dots.push({ lx: Math.cos(a)*R_OUTER, ly: ax, lz: Math.sin(a)*R_OUTER, isOuter: true, r: OUTER_DOT });
    }
  }
  for (let ri = 0; ri < 4; ri++) {
    const ax = INNER_RING_MULTS[ri] * INNER_SPACING;
    for (let di = 0; di < INNER_N; di++) {
      const a = (TAU * di) / INNER_N;
      dots.push({ lx: Math.cos(a)*R_INNER, ly: ax, lz: Math.sin(a)*R_INNER, isOuter: false, r: INNER_DOT });
    }
  }
  return dots;
}

const ALL_DOTS = buildDots();
const TOTAL    = ALL_DOTS.length;

// ─── Component ────────────────────────────────────────────────────────────────
export default function OrbitalRings() {
  const dotRefs = useRef<(HTMLDivElement | null)[]>(new Array(TOTAL).fill(null));
  const rafRef  = useRef<number>(0);
  const t0Ref   = useRef<number>(0);

  useEffect(() => {
    function frame(ts: number) {
      if (!t0Ref.current) t0Ref.current = ts;
      const t = (ts - t0Ref.current) / 1000;

      const outerAngle = (t / (T_OUTER_SPIN / 1000)) * TAU;
      const innerAngle = -(t / (T_INNER_SPIN / 1000)) * TAU;

      // Precession: rotY(p) × rotX(cone) × rotY(-p) — traces a cone
      const p = -(t / (T_PRECESS / 1000)) * TAU;
      const M_PREC = mul(rotY(p), mul(rotX(PRECESS_CONE * Math.PI/180), rotY(-p)));

      const M_OUTER = mul(M_PREC, mul(M_STATIC, rotY(outerAngle)));
      const M_INNER = mul(M_PREC, mul(M_STATIC, mul(rotY(innerAngle), M_DIHEDRAL)));

      // Find z range for depth bucketing
      let minZ = Infinity, maxZ = -Infinity;
      const wz = new Float32Array(TOTAL);
      const wx = new Float32Array(TOTAL);
      const wy = new Float32Array(TOTAL);

      for (let i = 0; i < TOTAL; i++) {
        const d = ALL_DOTS[i];
        const [x, y, z] = applyM(d.isOuter ? M_OUTER : M_INNER, d.lx, d.ly, d.lz);
        wx[i] = x; wy[i] = y; wz[i] = z;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }

      const zRange = maxZ - minZ || 1;

      for (let i = 0; i < TOTAL; i++) {
        const el = dotRefs.current[i];
        if (!el) continue;
        const depth = (wz[i] - minZ) / zRange;  // 0 = back, 1 = front
        const scale   = 0.45 + 0.55 * depth;
        const opacity = (0.25 + 0.75 * depth) * (ALL_DOTS[i].isOuter ? 1 : 0.55);
        const r = ALL_DOTS[i].r;
        el.style.transform = `translate3d(${wx[i] + SIZE/2 - r}px,${wy[i] + SIZE/2 - r}px,0) scale(${scale.toFixed(3)})`;
        el.style.opacity   = opacity.toFixed(3);
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      t0Ref.current = 0;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="hidden md:block select-none"
      style={{ width: SIZE, height: SIZE, position: 'relative', flexShrink: 0, overflow: 'hidden' }}
    >
      {ALL_DOTS.map((d, i) => (
        <div
          key={i}
          ref={el => { dotRefs.current[i] = el; }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width:  d.r * 2,
            height: d.r * 2,
            borderRadius: '50%',
            background: '#ffffff',
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
