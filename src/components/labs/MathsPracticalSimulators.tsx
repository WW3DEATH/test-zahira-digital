import React, { useState } from 'react';
import { Sliders, RotateCcw, CheckCircle2, TrendingUp, Compass, Target, Activity } from 'lucide-react';

interface MathsPracticalSimulatorsProps {
  selectedExpIndex: number; // 8: Lami, 9: Friction, 10: Projectile, 11: Simpson, 12: Center of Gravity
}

export const MathsPracticalSimulators: React.FC<MathsPracticalSimulatorsProps> = ({ selectedExpIndex }) => {
  // Simulator 1: Lami's Theorem
  const [forceP, setForceP] = useState<number>(5.0); // N (left upper)
  const [forceQ, setForceQ] = useState<number>(6.5); // N (right upper)
  const [angleAlpha, setAngleAlpha] = useState<number>(140); // between Q and R
  const [angleBeta, setAngleBeta] = useState<number>(130); // between P and R
  // angleGamma between P and Q is 360 - (alpha + beta)
  const angleGamma = Math.max(30, 360 - (angleAlpha + angleBeta));
  // By Lami's theorem, R = P * sin(gamma) / sin(beta)
  const radAlpha = (angleAlpha * Math.PI) / 180;
  const radBeta = (angleBeta * Math.PI) / 180;
  const radGamma = (angleGamma * Math.PI) / 180;
  const theoreticalR = (forceP * Math.sin(radGamma)) / Math.max(0.01, Math.sin(radBeta));
  const lamiRatioP = forceP / Math.max(0.01, Math.sin(radAlpha));
  const lamiRatioQ = forceQ / Math.max(0.01, Math.sin(radBeta));

  // Simulator 2: Inclined Plane & Limiting Friction
  const [inclineAngle, setInclineAngle] = useState<number>(25); // degrees
  const [blockMass, setBlockMass] = useState<number>(0.5); // kg
  const [surfaceMaterial, setSurfaceMaterial] = useState<'wood_wood' | 'rubber_wood' | 'steel_steel'>('wood_wood');

  const muValues: Record<string, number> = {
    wood_wood: 0.38,
    rubber_wood: 0.65,
    steel_steel: 0.18,
  };
  const currentMu = muValues[surfaceMaterial];
  const g = 9.8;
  const radTheta = (inclineAngle * Math.PI) / 180;
  const normalReactionR = blockMass * g * Math.cos(radTheta);
  const downhillGravForce = blockMass * g * Math.sin(radTheta);
  const maxStaticFrictionF = currentMu * normalReactionR;
  const criticalReposeAngle = Math.atan(currentMu) * (180 / Math.PI);
  const isSliding = inclineAngle > criticalReposeAngle;
  const isImpending = Math.abs(inclineAngle - criticalReposeAngle) <= 0.5;

  // Simulator 3: Projectile Motion
  const [launchSpeed, setLaunchSpeed] = useState<number>(24); // m/s
  const [launchAngle, setLaunchAngle] = useState<number>(45); // degrees
  const radLaunchAngle = (launchAngle * Math.PI) / 180;
  const maxProjectedHeight = (launchSpeed ** 2 * Math.sin(radLaunchAngle) ** 2) / (2 * g);
  const totalFlightTime = (2 * launchSpeed * Math.sin(radLaunchAngle)) / g;
  const totalHorizontalRange = (launchSpeed ** 2 * Math.sin(2 * radLaunchAngle)) / g;

  // Simulator 4: Simpson's 1/3 Rule
  const [simpsonFunction, setSimpsonFunction] = useState<'parabola' | 'sine' | 'cubic'>('parabola');
  const [simpsonIntervals, setSimpsonIntervals] = useState<number>(4); // must be even (2, 4, 6, 8, 12)

  // Interval [0, 2]
  const simpsonA = 0;
  const simpsonB = 2;
  const simpsonH = (simpsonB - simpsonA) / simpsonIntervals;

  const evaluateF = (x: number) => {
    if (simpsonFunction === 'parabola') return 4 - x * x; // ∫[0,2] = 16/3 ≈ 5.3333
    if (simpsonFunction === 'sine') return Math.sin(x) + 1; // ∫[0,2] = -cos(2) + cos(0) + 2 ≈ 3.4161
    return x * x * x; // ∫[0,2] = 2^4/4 = 4.0000
  };

  const exactIntegrals: Record<string, number> = {
    parabola: 16 / 3,
    sine: -Math.cos(2) + Math.cos(0) + 2,
    cubic: 4.0,
  };

  const ordinates: number[] = [];
  for (let i = 0; i <= simpsonIntervals; i++) {
    ordinates.push(evaluateF(simpsonA + i * simpsonH));
  }

  let simpsonSum = ordinates[0] + ordinates[ordinates.length - 1];
  for (let i = 1; i < ordinates.length - 1; i++) {
    simpsonSum += i % 2 !== 0 ? 4 * ordinates[i] : 2 * ordinates[i];
  }
  const numericalSimpsonArea = (simpsonH / 3) * simpsonSum;
  const exactArea = exactIntegrals[simpsonFunction];
  const simpsonErrorPercent = Math.abs((exactArea - numericalSimpsonArea) / exactArea) * 100;

  // Render Simulator 1: Lami's Theorem
  if (selectedExpIndex === 8) {
    return (
      <div className="space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Force P on Left Pulley (N)
                </label>
                <span className="font-mono text-blue-600 font-bold">{forceP.toFixed(1)} N</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={forceP}
                onChange={(e) => setForceP(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Force Q on Right Pulley (N)
                </label>
                <span className="font-mono text-blue-600 font-bold">{forceQ.toFixed(1)} N</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={forceQ}
                onChange={(e) => setForceQ(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Angle α (between Q & R): {angleAlpha}°
                </label>
                <input
                  type="range"
                  min="100"
                  max="160"
                  value={angleAlpha}
                  onChange={(e) => setAngleAlpha(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Angle β (between P & R): {angleBeta}°
                </label>
                <input
                  type="range"
                  min="100"
                  max="160"
                  value={angleBeta}
                  onChange={(e) => setAngleBeta(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
              <p className="font-bold text-blue-900 dark:text-blue-200">Lami’s Coplanar Law:</p>
              <p className="font-mono text-[11px] text-blue-700 dark:text-blue-300">
                P / sin(α) = Q / sin(β) = R / sin(γ)
              </p>
              <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                <span>Angle γ (P to Q) = {angleGamma}°</span>
                <span>Sum = {angleAlpha + angleBeta + angleGamma}°</span>
              </div>
            </div>
          </div>

          {/* SVG Force Board Canvas */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
            <span className="text-[10px] text-slate-400 mb-2">Gravesand’s Force Board Vector Display</span>
            <svg viewBox="-120 -120 240 240" className="w-56 h-56">
              {/* Central Ring */}
              <circle cx="0" cy="0" r="6" fill="#38bdf8" />
              {/* Vector Lines */}
              {/* Vector P */}
              <line x1="0" y1="0" x2={-Math.cos(radGamma / 2) * forceP * 12} y2={-Math.sin(radGamma / 2) * forceP * 12} stroke="#3b82f6" strokeWidth="3" />
              <text x={-Math.cos(radGamma / 2) * forceP * 12 - 15} y={-Math.sin(radGamma / 2) * forceP * 12} fill="#60a5fa" fontSize="10" fontWeight="bold">P ({forceP.toFixed(1)}N)</text>
              {/* Vector Q */}
              <line x1="0" y1="0" x2={Math.cos(radGamma / 2) * forceQ * 12} y2={-Math.sin(radGamma / 2) * forceQ * 12} stroke="#10b981" strokeWidth="3" />
              <text x={Math.cos(radGamma / 2) * forceQ * 12 + 5} y={-Math.sin(radGamma / 2) * forceQ * 12} fill="#34d399" fontSize="10" fontWeight="bold">Q ({forceQ.toFixed(1)}N)</text>
              {/* Vector R (Vertical Downward) */}
              <line x1="0" y1="0" x2="0" y2={theoreticalR * 10} stroke="#f43f5e" strokeWidth="3" />
              <text x="5" y={theoreticalR * 10 + 12} fill="#fb7185" fontSize="10" fontWeight="bold">R ({theoreticalR.toFixed(1)}N)</text>
            </svg>

            <div className="mt-3 text-center grid grid-cols-2 gap-3 w-full max-w-xs text-[10px] border-t border-slate-800 pt-2">
              <div>
                <span className="text-slate-400">P / sin(α):</span>
                <p className="font-mono text-sm font-bold text-blue-400">{lamiRatioP.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-400">Q / sin(β):</span>
                <p className="font-mono text-sm font-bold text-emerald-400">{lamiRatioQ.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Simulator 2: Inclined Plane & Limiting Friction
  if (selectedExpIndex === 9) {
    return (
      <div className="space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Plane Incline Angle (θ)
                </label>
                <span className="font-mono text-blue-600 font-bold">{inclineAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={inclineAngle}
                onChange={(e) => setInclineAngle(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0° Horizontal</span>
                <span className="font-bold text-amber-600">Critical Angle θc = {criticalReposeAngle.toFixed(1)}°</span>
                <span>60° Steep</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Contact Surface Pairing
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'wood_wood', label: 'Wood on Wood (μ = 0.38)' },
                  { id: 'rubber_wood', label: 'Rubber on Wood (μ = 0.65)' },
                  { id: 'steel_steel', label: 'Steel on Ice (μ = 0.18)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSurfaceMaterial(s.id as any)}
                    className={`p-2 rounded-xl border text-center font-semibold text-[10px] transition-all ${
                      surfaceMaterial === s.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Block Mass (m)
                </label>
                <span className="font-mono text-blue-600 font-bold">{blockMass.toFixed(2)} kg</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={blockMass}
                onChange={(e) => setBlockMass(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className={`p-3 rounded-xl border ${
              isSliding
                ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                : isImpending
                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSliding
                    ? 'Motion State: Block Accelerating Downhill (θ > θc)'
                    : isImpending
                    ? 'Motion State: Limiting Equilibrium / Impending Motion (θ ≈ θc)'
                    : 'Motion State: Static Equilibrium at Rest (θ < θc)'}
                </span>
              </div>
            </div>
          </div>

          {/* Graphical Incline Visualizer */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
            <span className="text-[10px] text-slate-400 mb-3">Mechanical Free Body Diagram (FBD)</span>

            <div className="relative w-64 h-44 flex items-end justify-start overflow-hidden">
              {/* Incline Wedge */}
              <div
                className="origin-bottom-left w-56 h-2 bg-blue-500 rounded-full transition-transform duration-300 relative"
                style={{ transform: `rotate(-${inclineAngle}deg)` }}
              >
                {/* Block on Plane */}
                <div
                  className={`absolute left-24 -top-8 w-12 h-8 rounded-md border-2 border-white flex items-center justify-center font-bold text-[9px] shadow-lg transition-transform ${
                    isSliding ? 'bg-rose-600 translate-x-[-30px]' : 'bg-amber-600'
                  }`}
                >
                  {blockMass} kg
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full mt-4 text-[10px] text-center border-t border-slate-800 pt-2">
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Normal Reaction R</span>
                <p className="font-mono text-xs font-bold text-blue-400">{normalReactionR.toFixed(2)} N</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Downhill Force mg·sinθ</span>
                <p className="font-mono text-xs font-bold text-amber-400">{downhillGravForce.toFixed(2)} N</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-slate-400">Max Friction μ·R</span>
                <p className="font-mono text-xs font-bold text-emerald-400">{maxStaticFrictionF.toFixed(2)} N</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Simulator 3: Projectile Motion
  if (selectedExpIndex === 10) {
    return (
      <div className="space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Initial Launch Velocity (u in m/s)
                </label>
                <span className="font-mono text-blue-600 font-bold">{launchSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={launchSpeed}
                onChange={(e) => setLaunchSpeed(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Elevation Angle (α in degrees)
                </label>
                <span className="font-mono text-blue-600 font-bold">{launchAngle}°</span>
              </div>
              <input
                type="range"
                min="15"
                max="75"
                step="5"
                value={launchAngle}
                onChange={(e) => setLaunchAngle(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Maximum horizontal range occurs at launch angle α = 45°.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Max Height (H)</span>
                <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{maxProjectedHeight.toFixed(2)} m</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Time of Flight (T)</span>
                <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalFlightTime.toFixed(2)} s</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Horizontal Range (R)</span>
                <p className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{totalHorizontalRange.toFixed(2)} m</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
              <p className="font-bold text-blue-900 dark:text-blue-200">Parabolic Trajectory Formula:</p>
              <p className="font-mono text-[11px] text-blue-700 dark:text-blue-300">
                y = x · tan(α) - [g · x²] / [2 · u² · cos²(α)]
              </p>
            </div>
          </div>

          {/* Canvas Trajectory Simulation */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
            <span className="text-[10px] text-slate-400 mb-2">Simulated Ballistic Parabola Flight Trace</span>
            <svg viewBox="0 0 280 160" className="w-full h-44 bg-slate-900/50 rounded-xl border border-slate-800">
              {/* Ground level */}
              <line x1="20" y1="140" x2="260" y2="140" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />

              {/* Dynamic Parabola Path */}
              {(() => {
                const points: string[] = [];
                const steps = 30;
                for (let i = 0; i <= steps; i++) {
                  const frac = i / steps;
                  const x = frac * totalHorizontalRange;
                  const y = x * Math.tan(radLaunchAngle) - (g * x * x) / (2 * launchSpeed * launchSpeed * Math.cos(radLaunchAngle) ** 2);
                  const svgX = 25 + (x / 160) * 230;
                  const svgY = 140 - (y / 50) * 120;
                  points.push(`${svgX},${svgY}`);
                }
                return (
                  <>
                    <polyline points={points.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="3" />
                    {/* Launch Cannon */}
                    <line
                      x1="25"
                      y1="140"
                      x2={25 + Math.cos(radLaunchAngle) * 20}
                      y2={140 - Math.sin(radLaunchAngle) * 20}
                      stroke="#f59e0b"
                      strokeWidth="5"
                    />
                    {/* Apex Marker */}
                    <circle cx={25 + (totalHorizontalRange / 2 / 160) * 230} cy={140 - (maxProjectedHeight / 50) * 120} r="4" fill="#f43f5e" />
                  </>
                );
              })()}
            </svg>

            <div className="mt-3 text-center text-[10px] text-slate-400">
              Muzzle Speed: <strong className="text-white">{launchSpeed} m/s</strong> • Gravity g: <strong className="text-white">9.8 m/s²</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Simulator 4: Simpson's 1/3 Rule
  if (selectedExpIndex === 11) {
    return (
      <div className="space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Mathematical Test Function f(x) on [0, 2]
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'parabola', label: 'f(x) = 4 - x²' },
                  { id: 'sine', label: 'f(x) = sin(x) + 1' },
                  { id: 'cubic', label: 'f(x) = x³' },
                ].map((fn) => (
                  <button
                    key={fn.id}
                    onClick={() => setSimpsonFunction(fn.id as any)}
                    className={`p-2 rounded-xl border text-center font-semibold text-[10px] transition-all ${
                      simpsonFunction === fn.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {fn.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Number of Even Intervals (n strips)
                </label>
                <span className="font-mono text-blue-600 font-bold">{simpsonIntervals} strips (h = {simpsonH.toFixed(2)})</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="2"
                value={simpsonIntervals}
                onChange={(e) => setSimpsonIntervals(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Simpson’s 1/3 Rule strictly requires n to be an even integer.</p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
              <p className="font-bold text-blue-900 dark:text-blue-200">Simpson’s 1/3 Rule Quadrature:</p>
              <p className="font-mono text-[11px] text-blue-700 dark:text-blue-300">
                I ≈ (h/3) · [y₀ + 4·(y₁ + y₃ + ...) + 2·(y₂ + y₄ + ...) + yₙ]
              </p>
            </div>
          </div>

          {/* Area Comparison Table & Error Gauge */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
            <span className="text-[10px] text-slate-400 mb-3">Analytic Calculus vs Numerical Quadrature</span>

            <div className="grid grid-cols-2 gap-4 w-full text-center">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400">Analytic Anti-Derivative Area</span>
                <h4 className="font-mono text-xl font-bold text-emerald-400 mt-1">
                  {exactArea.toFixed(5)}
                </h4>
                <span className="text-[9px] text-emerald-500">Exact Solution</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400">Simpson's Approx Area ({simpsonIntervals} strips)</span>
                <h4 className="font-mono text-xl font-bold text-blue-400 mt-1">
                  {numericalSimpsonArea.toFixed(5)}
                </h4>
                <span className="text-[9px] text-blue-400">Numerical Sum</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 w-full flex items-center justify-between">
              <span className="text-[11px] text-slate-300">Relative Approximation Error:</span>
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                simpsonErrorPercent < 0.1 ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
              }`}>
                {simpsonErrorPercent.toFixed(4)}% Error
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback for Center of Gravity or other practicals
  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-blue-600 text-white">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Center of Gravity (C.G.) & Centroid Triangulation Practical
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Plumb line intersection and rigid body moment equilibrium
          </p>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        Verify that the centroid coordinates (x̄, ȳ) = (ΣA_i·x_i / ΣA_i, ΣA_i·y_i / ΣA_i) coincide with the physical balance point of the composite lamina.
      </div>
    </div>
  );
};
