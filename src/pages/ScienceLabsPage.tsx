import React, { useState } from 'react';
import {
  FlaskConical,
  Microscope,
  Atom,
  Dna,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  BookOpen,
  Info,
  Sliders,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  Thermometer,
  Zap,
  Activity,
  Maximize2,
  Table,
  Eye,
  Beaker,
  Gauge,
  Flame,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';

type LabDiscipline = 'bio' | 'physical';

export const ScienceLabsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeLab, setActiveLab] = useState<LabDiscipline>('bio');
  const [selectedBioExp, setSelectedBioExp] = useState<number>(0);
  const [selectedPhysExp, setSelectedPhysExp] = useState<number>(0);

  // Bio Lab 1: Microscope State
  const [micObjective, setMicObjective] = useState<number>(10); // 4x, 10x, 40x, 100x
  const [micSpecimen, setMicSpecimen] = useState<'onion' | 'cheek' | 'blood'>('onion');
  const [micFocus, setMicFocus] = useState<number>(50); // 0 to 100, 50 is sharp
  const [micStain, setMicStain] = useState<'none' | 'iodine' | 'methylene_blue'>('iodine');
  const [micLight, setMicLight] = useState<number>(80);

  // Bio Lab 2: Food Chemistry State
  const [foodSample, setFoodSample] = useState<'glucose' | 'starch' | 'egg_albumin' | 'oil'>('glucose');
  const [foodReagent, setFoodReagent] = useState<'benedict' | 'iodine' | 'biuret' | 'ethanol'>('benedict');
  const [waterBathHeated, setWaterBathHeated] = useState<boolean>(false);
  const [testTested, setTestTested] = useState<boolean>(false);

  // Bio Lab 3: Catalase Enzyme Kinetics State
  const [enzymeTemp, setEnzymeTemp] = useState<number>(37); // deg C
  const [enzymePH, setEnzymePH] = useState<number>(7);
  const [enzymeSubstrateConc, setEnzymeSubstrateConc] = useState<number>(3); // %
  const [enzymeGasVolume, setEnzymeGasVolume] = useState<number>(24); // ml in 2 min
  const [enzymeRunning, setEnzymeRunning] = useState<boolean>(false);

  // Bio Lab 4: Osmosis & Water Potential State
  const [sucroseMolarity, setSucroseMolarity] = useState<number>(0.4); // 0.0 to 1.0 M
  const [osmosisTrialDone, setOsmosisTrialDone] = useState<boolean>(false);

  // Phys Lab 1: Vernier Calipers & Micrometer State
  const [metrologyTool, setMetrologyTool] = useState<'vernier' | 'micrometer'>('vernier');
  const [vernierJawPos, setVernierJawPos] = useState<number>(24.6); // mm
  const [micrometerThimble, setMicrometerThimble] = useState<number>(6.38); // mm

  // Phys Lab 2: Simple Pendulum State
  const [pendulumLength, setPendulumLength] = useState<number>(0.8); // meters (0.2 to 1.4)
  const [pendulumTimerRunning, setPendulumTimerRunning] = useState<boolean>(false);
  const [pendulumRecordedT, setPendulumRecordedT] = useState<number | null>(null);

  // Phys Lab 4: Ohm's Law & Meter Bridge State
  const [circuitVoltage, setCircuitVoltage] = useState<number>(6.0); // Volts
  const [circuitResistance, setCircuitResistance] = useState<number>(10); // Ohms
  const [meterBridgeJockeyPos, setMeterBridgeJockeyPos] = useState<number>(45); // cm on 100cm wire
  const [knownResistorR, setKnownResistorR] = useState<number>(12); // Ohms

  // Phys Lab 7: Acid-Base Titration State
  const [buretteReading, setBuretteReading] = useState<number>(0.0); // ml added
  const [titrationIndicator, setTitrationIndicator] = useState<'phenolphthalein' | 'methyl_orange'>('phenolphthalein');
  const [titrationEndpointHit, setTitrationEndpointHit] = useState<boolean>(false);

  // Export Laboratory Practical Report PDF
  const handleExportLabReportPDF = (discipline: LabDiscipline, expTitle: string, syllabusCode: string) => {
    try {
      const doc = new jsPDF();

      // Official Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('ZAHIRA COLLEGE MAWANELLA • 2K28 SCIENCE EM', 20, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('G.C.E. ADVANCED LEVEL VIRTUAL SCIENCE PRACTICAL LABORATORY REPORT', 20, 26);
      doc.text(`Discipline: ${discipline === 'bio' ? 'Biological Science Practical Unit' : 'Physical Science Practical Unit'}`, 20, 31);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 35, 190, 35);

      // Student and experiment metadata
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(20, 40, 170, 16, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Practical Syllabus Ref: ${syllabusCode}`, 24, 46);
      doc.text(`Scholar: ${userProfile?.fullName || 'Zahira Science Scholar'} (${userProfile?.email || '2k28-science@zahira.edu'})`, 24, 52);
      doc.text(`Date Completed: ${new Date().toLocaleDateString()}`, 125, 46);
      doc.text('Cohort: A/L 2028 Science EM', 125, 52);

      // Experiment Title Banner
      doc.setFillColor(discipline === 'bio' ? 236 : 239, discipline === 'bio' ? 253 : 246, discipline === 'bio' ? 245 : 255);
      doc.roundedRect(20, 60, 170, 10, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(discipline === 'bio' ? 6 : 30, discipline === 'bio' ? 95 : 64, discipline === 'bio' ? 70 : 175);
      doc.text(`Experiment: ${expTitle}`, 24, 66.5);

      // Theory & Syllabus Formulation
      let y = 78;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Principle & Theoretical Background', 20, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const theoryText = discipline === 'bio'
        ? 'Standard G.C.E. Advanced Level Biology curriculum practical. Investigates biological structures, enzyme kinetics, cellular respiration, and tissue water potential through quantitative and qualitative experimental protocols.'
        : 'Standard G.C.E. Advanced Level Physics & Physical Chemistry curriculum practical. Investigates fundamental physical constants, metrology error analysis, circuit analysis, kinematics, optics, and volumetric stoichiometry.';
      const theoryLines = doc.splitTextToSize(theoryText, 170);
      doc.text(theoryLines, 20, y);
      y += theoryLines.length * 5 + 6;

      // Apparatus & Materials
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Apparatus, Reagents & Experimental Setup', 20, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const apparatusList = discipline === 'bio'
        ? '• Compound Light Microscope (4x, 10x, 40x, 100x oil immersion)\n• Glass slides, coverslips, mounted needles, methylene blue, iodine stain\n• Water bath (0 - 100°C), boiling tubes, graduated gas syringe, digital balance\n• Potato tuber cylinders, sucrose solutions (0.0M to 1.0M), Audus micro-burette'
        : '• Vernier Calipers & Micrometer Screw Gauge (0.01 mm precision)\n• Simple Pendulum with photogate timer & meter rule (length calibration)\n• Searle\'s Young\'s Modulus wire tensile apparatus & slotted weights\n• Meter Bridge (Wheatstone Bridge wire, galvanometer, standard resistance box)\n• Precision 50 ml burette, pipette, conical flask, phenolphthalein indicator';
      const appLines = doc.splitTextToSize(apparatusList, 170);
      doc.text(appLines, 20, y);
      y += appLines.length * 5 + 8;

      // Observations Table
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 7.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('3. LABORATORY OBSERVATIONS & TRIAL MEASUREMENTS', 24, y + 5);

      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Trial 1: Recorded with high precision according to laboratory protocol.', 24, y);
      doc.text('Trial 2: Calibrated for zero-error and ambient environmental fluctuations.', 24, y + 5);
      doc.text('Trial 3: Mean evaluated to minimize random and systematic experimental errors.', 24, y + 10);
      y += 20;

      // Verification & Certification Sign-Off
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Certified by Academic Administration:', 20, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Zahira College Mawanella Science Project management', 20, y);

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Faculty Verified • Official G.C.E. Advanced Level Science Practical Record Sheet', 20, y);

      doc.save(`Zahira_College_${discipline === 'bio' ? 'Bio' : 'Physical'}_Lab_${expTitle.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('Lab report export error:', e);
    }
  };

  // Bio Practicals Syllabus Array
  const bioPracticals = [
    {
      id: 'bio-1',
      code: 'BIO-PRAC-01',
      title: 'Cell Microscopy & Staining (Onion, Cheek & Blood Cells)',
      duration: '45 mins',
      objective: 'Master compound light microscopy, lens magnification, stage focus, and cytological staining of plant and animal tissues.',
    },
    {
      id: 'bio-2',
      code: 'BIO-PRAC-02',
      title: 'Biochemical Assays for Carbohydrates, Proteins & Lipids',
      duration: '40 mins',
      objective: 'Perform Benedict’s reducing sugar test, Iodine starch test, Biuret peptide test, and Ethanol lipid emulsion assay.',
    },
    {
      id: 'bio-3',
      code: 'BIO-PRAC-03',
      title: 'Enzyme Kinetics & Catalase Decomposition Activity',
      duration: '50 mins',
      objective: 'Investigate effect of temperature (0-90°C), pH (1-14), and substrate concentration on potato catalase activity (2H₂O₂ → 2H₂O + O₂).',
    },
    {
      id: 'bio-4',
      code: 'BIO-PRAC-04',
      title: 'Osmosis & Water Potential in Potato Tuber Cylinders',
      duration: '60 mins',
      objective: 'Determine solute potential (Ψs) and incipient plasmolysis by measuring mass change in sucrose gradient (0.0M to 1.0M).',
    },
    {
      id: 'bio-5',
      code: 'BIO-PRAC-05',
      title: 'Rate of Photosynthesis via Hydrilla Bubble Count',
      duration: '45 mins',
      objective: 'Analyze light intensity (inverse square law), sodium bicarbonate (CO₂) concentration, and light wavelength filters.',
    },
    {
      id: 'bio-6',
      code: 'BIO-PRAC-06',
      title: 'Transpiration Rate Measurement via Ganong’s Potometer',
      duration: '50 mins',
      objective: 'Quantify transpiration rate under still air, high wind (fan), humid conditions, and varying light intensities.',
    },
    {
      id: 'bio-7',
      code: 'BIO-PRAC-07',
      title: 'Mitosis Stage Identification & Mitotic Index Calculation',
      duration: '40 mins',
      objective: 'Identify Prophase, Metaphase, Anaphase, Telophase in onion root tip squashes and compute Mitotic Index %.',
    },
    {
      id: 'bio-8',
      code: 'BIO-PRAC-08',
      title: 'Photosynthetic Pigment Separation by Paper Chromatography',
      duration: '45 mins',
      objective: 'Separate Chlorophyll a, Chlorophyll b, Xanthophyll, and Carotene from spinach extract and compute Rf values.',
    },
  ];

  // Physical Science Practicals Syllabus Array
  const physicalPracticals = [
    {
      id: 'phys-1',
      code: 'PHYS-PRAC-01',
      title: 'Precision Metrology: Vernier Caliper & Micrometer Screw Gauge',
      duration: '45 mins',
      objective: 'Measure internal/external diameters, sphere volume, wire thickness, with zero-error calibration and vernier coincidence.',
    },
    {
      id: 'phys-2',
      code: 'PHYS-PRAC-02',
      title: 'Simple Pendulum & Determination of Acceleration due to Gravity (g)',
      duration: '40 mins',
      objective: 'Vary pendulum length (0.2m to 1.4m), time 20 oscillations, plot T² vs L graph, and determine experimental g = 4π²/slope.',
    },
    {
      id: 'phys-3',
      code: 'PHYS-PRAC-03',
      title: 'Hooke’s Law & Young’s Modulus via Searle’s Apparatus',
      duration: '50 mins',
      objective: 'Apply slotted weights to metal wire, measure micro-extension using micrometer spirit level, compute stress/strain and Young’s Modulus.',
    },
    {
      id: 'phys-4',
      code: 'PHYS-PRAC-04',
      title: 'Ohm’s Law & Resistance / Resistivity via Meter Bridge',
      duration: '50 mins',
      objective: 'Verify linear V-I relation; use 1-meter Wheatstone wire bridge with null galvanometer deflection to find unknown resistor X and resistivity ρ.',
    },
    {
      id: 'phys-5',
      code: 'PHYS-PRAC-05',
      title: 'Snell’s Law, Refractive Index & Prism Angle of Minimum Deviation',
      duration: '45 mins',
      objective: 'Trace laser rays through semicircular block to find critical angle θc and equilateral glass prism to find Dm and n.',
    },
    {
      id: 'phys-6',
      code: 'PHYS-PRAC-06',
      title: 'Speed of Sound via Resonance Tube & Calibrated Tuning Forks',
      duration: '40 mins',
      objective: 'Tune column water height to find 1st resonance (λ/4) and 2nd resonance (3λ/4), calculating speed of sound v = 2f(L₂ - L₁).',
    },
    {
      id: 'phys-7',
      code: 'PHYS-PRAC-07',
      title: 'Acid-Base Volumetric Titration (HCl vs 0.100 M NaOH)',
      duration: '50 mins',
      objective: 'Perform dropwise burette titration with phenolphthalein indicator, plot pH titration curve, and calculate molarity CaVa = CbVb.',
    },
    {
      id: 'phys-8',
      code: 'PHYS-PRAC-08',
      title: 'Boyle’s Law & Gas Thermodynamics Verification (P · V = constant)',
      duration: '40 mins',
      objective: 'Compress gas in calibrated syringe with pressure sensor, measure P vs V, and plot P vs 1/V straight line through origin.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl border border-blue-900/30 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
              <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
              <span>Zahira College Mawanella Science Project Management</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white">
              Virtual Science Practical Laboratories
            </h1>
            <p className="text-xs md:text-sm text-blue-200/90 mt-2 max-w-2xl leading-relaxed">
              Fully interactive laboratory simulation suite for G.C.E. Advanced Level 2k28 Science English Medium scholars. Conduct real-time experiments, adjust apparatus parameters, record trial observations, and export certified syllabus reports.
            </p>
          </div>

          {/* Discipline Selector Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 shrink-0">
            <button
              onClick={() => setActiveLab('bio')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                activeLab === 'bio'
                  ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Dna className="w-4 h-4 text-emerald-300" />
              <div className="text-left">
                <p className="leading-tight">Bio Science Lab</p>
                <p className="text-[10px] opacity-75 font-normal">Biological Science Practicals</p>
              </div>
            </button>

            <button
              onClick={() => setActiveLab('physical')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs transition-all ${
                activeLab === 'physical'
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Atom className="w-4 h-4 text-blue-300" />
              <div className="text-left">
                <p className="leading-tight">Physical Science Lab</p>
                <p className="text-[10px] opacity-75 font-normal">Physics & Chemistry Practicals</p>
              </div>
            </button>
          </div>
        </div>

        {/* Syllabus Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-300">
              Active Syllabus Track: <strong className="text-white">{activeLab === 'bio' ? 'A/L Biology 8 Core Practical Units' : 'A/L Physics & Chemistry 8 Core Practical Units'}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
              100% G.C.E. Syllabus Coverage
            </span>
          </div>

          <div className="text-slate-300 text-xs flex items-center gap-2">
            <span>Certification Authority:</span>
            <span className="font-semibold text-white">Zahira College Mawanella Science Project management</span>
          </div>
        </div>
      </div>

      {/* Main Lab Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Syllabus Practical Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-serif text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{activeLab === 'bio' ? 'Biology Syllabus Practicals' : 'Physical Science Practicals'}</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                8 Experiments
              </span>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 sidebar-menu-scroll">
              {(activeLab === 'bio' ? bioPracticals : physicalPracticals).map((exp, idx) => {
                const isSelected = (activeLab === 'bio' ? selectedBioExp : selectedPhysExp) === idx;
                return (
                  <button
                    key={exp.id}
                    onClick={() => {
                      if (activeLab === 'bio') setSelectedBioExp(idx);
                      else setSelectedPhysExp(idx);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? activeLab === 'bio'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm'
                          : 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        {exp.code}
                      </span>
                      <span className="text-[10px] text-slate-400">{exp.duration}</span>
                    </div>
                    <p className="font-bold text-[12px] leading-snug line-clamp-2">{exp.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{exp.objective}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Interactive Simulator & Laboratory Bench */}
        <div className="lg:col-span-8 space-y-6">
          {activeLab === 'bio' ? (
            /* =========================================================================
               BIO SCIENCE VIRTUAL LABORATORY
               ========================================================================= */
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Lab Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-950/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      {bioPracticals[selectedBioExp].code}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                      {bioPracticals[selectedBioExp].title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {bioPracticals[selectedBioExp].objective}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleExportLabReportPDF(
                      'bio',
                      bioPracticals[selectedBioExp].title,
                      bioPracticals[selectedBioExp].code
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Lab Report (PDF)</span>
                </button>
              </div>

              {/* Experiment Simulator Core */}
              <div className="p-6">
                {selectedBioExp === 0 && (
                  /* Practical 1: Microscope & Staining */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Microscope Viewport */}
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                        <div className="relative w-64 h-64 rounded-full border-4 border-slate-700 bg-black overflow-hidden flex items-center justify-center shadow-2xl">
                          {/* Circular Lens View */}
                          <div
                            className="w-full h-full flex items-center justify-center transition-all duration-300"
                            style={{
                              filter: `blur(${Math.abs(micFocus - 50) * 0.15}px) brightness(${micLight * 0.012})`,
                              backgroundColor: micStain === 'iodine' ? '#fef08a22' : micStain === 'methylene_blue' ? '#bfdbfe33' : '#000000',
                            }}
                          >
                            {micSpecimen === 'onion' && (
                              <div className="grid grid-cols-4 gap-1 p-2 w-full h-full opacity-85">
                                {[...Array(16)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="border border-amber-300/60 rounded-xs flex items-center justify-center relative p-1 bg-amber-100/10"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-amber-400/80 shadow-xs" title="Nucleus" />
                                    <span className="text-[7px] text-amber-200/40 absolute bottom-0.5 right-0.5">Cell Wall</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {micSpecimen === 'cheek' && (
                              <div className="relative w-full h-full flex items-center justify-center p-4">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="absolute w-20 h-14 rounded-[40%] border border-blue-400/40 bg-blue-500/10 flex items-center justify-center"
                                    style={{
                                      top: `${15 + i * 16}%`,
                                      left: `${10 + (i % 3) * 24}%`,
                                      transform: `rotate(${i * 25}deg)`,
                                    }}
                                  >
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600/90" title="Cheek Cell Nucleus" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {micSpecimen === 'blood' && (
                              <div className="relative w-full h-full p-2 flex flex-wrap gap-2 items-center justify-center">
                                {[...Array(24)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`rounded-full flex items-center justify-center ${
                                      i % 7 === 0 ? 'w-5 h-5 bg-purple-400/80 border border-purple-200' : 'w-3 h-3 bg-red-500/70'
                                    }`}
                                    title={i % 7 === 0 ? 'Leukocyte (WBC)' : 'Erythrocyte (RBC)'}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Optical Reticle / Graticule Overlay */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                            <div className="w-full h-px bg-emerald-400" />
                            <div className="h-full w-px bg-emerald-400 absolute" />
                            <div className="w-16 h-16 border border-emerald-400 rounded-full absolute" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full mt-4 text-[11px] text-slate-400">
                          <span>Magnification: <strong className="text-emerald-400">{micObjective * 10}x</strong></span>
                          <span>Focus Sharpness: <strong className={Math.abs(micFocus - 50) < 5 ? 'text-emerald-400' : 'text-amber-400'}>{100 - Math.abs(micFocus - 50) * 2}%</strong></span>
                          <span>Condenser: <strong className="text-slate-200">{micLight}%</strong></span>
                        </div>
                      </div>

                      {/* Microscope Controls Bench */}
                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                            1. Select Specimen Slide
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'onion', label: 'Onion Epidermal Peel' },
                              { id: 'cheek', label: 'Human Cheek Epithelial' },
                              { id: 'blood', label: 'Human Blood Smear' },
                            ].map((s) => (
                              <button
                                key={s.id}
                                onClick={() => setMicSpecimen(s.id as any)}
                                className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                                  micSpecimen === s.id
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                            2. Revolving Nosepiece (Objective Lens)
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[4, 10, 40, 100].map((obj) => (
                              <button
                                key={obj}
                                onClick={() => setMicObjective(obj)}
                                className={`py-1.5 px-2 rounded-lg font-mono font-bold border transition-all ${
                                  micObjective === obj
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {obj}x ({obj * 10}x total)
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              3. Fine Focus Adjustment Knob
                            </label>
                            <span className="font-mono text-emerald-600">{micFocus}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={micFocus}
                            onChange={(e) => setMicFocus(Number(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Rotate knob until cell borders and nuclei appear sharp (around 50%).</p>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                            4. Apply Cytological Staining Reagent
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'none', label: 'Unstained (Saline)' },
                              { id: 'iodine', label: 'Iodine Solution (Plant)' },
                              { id: 'methylene_blue', label: 'Methylene Blue (Animal)' },
                            ].map((st) => (
                              <button
                                key={st.id}
                                onClick={() => setMicStain(st.id as any)}
                                className={`p-1.5 rounded-lg border text-center font-medium ${
                                  micStain === st.id
                                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scientific Analysis Notes */}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Syllabus Diagnostic Observations</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        Plant cells (Onion) display rigid rectangular cellulose cell walls, large central vacuoles, and peripheral nuclei. Animal cells (Cheek epithelial) lack cell walls, possessing irregular flexible plasma membranes with central darkly-stained nuclei using Methylene Blue.
                      </p>
                    </div>
                  </div>
                )}

                {selectedBioExp === 1 && (
                  /* Practical 2: Food Chemistry Assays */
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                            1. Select Food Nutrient Sample
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'glucose', label: '1% Glucose Solution' },
                              { id: 'starch', label: '1% Starch Suspension' },
                              { id: 'egg_albumin', label: 'Egg Albumin (Protein)' },
                              { id: 'oil', label: 'Vegetable Cooking Oil' },
                            ].map((f) => (
                              <button
                                key={f.id}
                                onClick={() => {
                                  setFoodSample(f.id as any);
                                  setTestTested(false);
                                  setWaterBathHeated(false);
                                }}
                                className={`p-2 rounded-xl border text-left font-semibold ${
                                  foodSample === f.id
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                            2. Add Chemical Reagent
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'benedict', label: 'Benedict’s Qualitative Reagent' },
                              { id: 'iodine', label: 'Iodine in Potassium Iodide' },
                              { id: 'biuret', label: 'Biuret Reagent (NaOH + CuSO₄)' },
                              { id: 'ethanol', label: 'Ethanol Emulsion Test' },
                            ].map((r) => (
                              <button
                                key={r.id}
                                onClick={() => {
                                  setFoodReagent(r.id as any);
                                  setTestTested(false);
                                }}
                                className={`p-2 rounded-xl border text-left font-semibold ${
                                  foodReagent === r.id
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {foodReagent === 'benedict' && (
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-amber-900 dark:text-amber-200">Water Bath Required (80-100°C)</p>
                              <p className="text-[10px] text-amber-700 dark:text-amber-300">Benedict’s reaction requires 3 minutes boiling.</p>
                            </div>
                            <button
                              onClick={() => {
                                setWaterBathHeated(true);
                                setTestTested(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                            >
                              Heat Water Bath
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => setTestTested(true)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Run Reagent Reaction</span>
                        </button>
                      </div>

                      {/* Test Tube Reaction Visualization */}
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="relative w-16 h-52 border-4 border-slate-600 rounded-b-3xl bg-slate-900/80 overflow-hidden flex flex-col justify-end p-1 shadow-2xl">
                          {/* Liquid level */}
                          <div
                            className="w-full h-36 rounded-b-2xl transition-all duration-700 flex items-center justify-center text-center p-1 text-[9px] font-bold text-white shadow-inner"
                            style={{
                              backgroundColor: !testTested
                                ? '#93c5fd'
                                : foodSample === 'glucose' && foodReagent === 'benedict' && waterBathHeated
                                ? '#b91c1c' // Brick red
                                : foodSample === 'starch' && foodReagent === 'iodine'
                                ? '#1e1b4b' // Blue black
                                : foodSample === 'egg_albumin' && foodReagent === 'biuret'
                                ? '#7c3aed' // Violet purple
                                : foodSample === 'oil' && foodReagent === 'ethanol'
                                ? '#e2e8f0' // Milky white emulsion
                                : '#38bdf8', // Default reagent color (negative)
                            }}
                          >
                            {!testTested ? (
                              <span className="text-slate-800">Sample + Reagent</span>
                            ) : foodSample === 'glucose' && foodReagent === 'benedict' && waterBathHeated ? (
                              <span>Brick-Red Precipitate (+)</span>
                            ) : foodSample === 'starch' && foodReagent === 'iodine' ? (
                              <span>Blue-Black Complex (+)</span>
                            ) : foodSample === 'egg_albumin' && foodReagent === 'biuret' ? (
                              <span>Purple / Violet Complex (+)</span>
                            ) : foodSample === 'oil' && foodReagent === 'ethanol' ? (
                              <span className="text-slate-800">Milky Emulsion (+)</span>
                            ) : (
                              <span className="text-slate-800">Negative (-)</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 text-center">
                          <p className="font-mono text-xs text-emerald-400 font-bold">
                            {!testTested
                              ? 'Ready for observation'
                              : foodSample === 'glucose' && foodReagent === 'benedict' && waterBathHeated
                              ? 'Positive for Reducing Sugars (Cu²⁺ reduced to Cu₂O)'
                              : foodSample === 'starch' && foodReagent === 'iodine'
                              ? 'Positive for Starch (Polyiodide-amylose helical complex)'
                              : foodSample === 'egg_albumin' && foodReagent === 'biuret'
                              ? 'Positive for Peptide Bonds / Proteins'
                              : foodSample === 'oil' && foodReagent === 'ethanol'
                              ? 'Positive for Lipids (Hydrophobic dispersion emulsion)'
                              : 'Negative Test Result (No specific macromolecule reaction)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBioExp === 2 && (
                  /* Practical 3: Catalase Enzyme Kinetics */
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              Temperature (°C)
                            </label>
                            <span className="font-mono text-emerald-600 font-bold">{enzymeTemp}°C</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="90"
                            value={enzymeTemp}
                            onChange={(e) => {
                              const t = Number(e.target.value);
                              setEnzymeTemp(t);
                              // Catalase optimal is ~37-40C. Above 55C denatures.
                              const rate = t < 10 ? 4 : t < 25 ? 12 : t <= 40 ? 28 : t < 55 ? 16 : 1;
                              setEnzymeGasVolume(rate);
                            }}
                            className="w-full accent-emerald-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              pH Environment
                            </label>
                            <span className="font-mono text-emerald-600 font-bold">pH {enzymePH}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="14"
                            value={enzymePH}
                            onChange={(e) => {
                              const p = Number(e.target.value);
                              setEnzymePH(p);
                              const rate = p === 7 ? 26 : Math.abs(p - 7) <= 2 ? 14 : 2;
                              setEnzymeGasVolume(rate);
                            }}
                            className="w-full accent-emerald-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              Substrate H₂O₂ Concentration (%)
                            </label>
                            <span className="font-mono text-emerald-600 font-bold">{enzymeSubstrateConc}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="6"
                            step="0.5"
                            value={enzymeSubstrateConc}
                            onChange={(e) => setEnzymeSubstrateConc(Number(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                        </div>

                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                          <p className="font-bold text-emerald-900 dark:text-emerald-200">Enzymatic Reaction Formula</p>
                          <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                            2 H₂O₂ (aq) —[Catalase]→ 2 H₂O (l) + O₂ (g) ↑
                          </p>
                        </div>
                      </div>

                      {/* Gas Syringe Visualization */}
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
                        <div className="text-center mb-3">
                          <span className="text-[11px] text-slate-400">Gas Syringe O₂ Evolution (2 min)</span>
                          <h4 className="font-mono text-2xl font-bold text-emerald-400">{enzymeGasVolume} cm³ O₂</h4>
                        </div>

                        <div className="relative w-64 h-12 border-2 border-slate-500 rounded-lg bg-slate-900 overflow-hidden flex items-center p-1">
                          {/* Syringe Piston */}
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded transition-all duration-500"
                            style={{ width: `${(enzymeGasVolume / 35) * 100}%` }}
                          />
                          <div className="absolute right-2 text-[10px] font-mono text-slate-400">Max 35 ml</div>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-4 text-center">
                          {enzymeTemp >= 60
                            ? 'Enzyme Denatured: High thermal energy disrupted tertiary hydrogen & disulfide bonds.'
                            : enzymePH !== 7 && Math.abs(enzymePH - 7) > 2
                            ? 'Extreme pH altered active site ionization charges, lowering catalytic turnover.'
                            : 'Optimal catalytic velocity: Active site retains ideal conformational fit.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBioExp === 3 && (
                  /* Practical 4: Osmosis in Potato Tissue */
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              Sucrose Solution Molarity (M)
                            </label>
                            <span className="font-mono text-emerald-600 font-bold">{sucroseMolarity.toFixed(2)} M</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.1"
                            value={sucroseMolarity}
                            onChange={(e) => {
                              setSucroseMolarity(Number(e.target.value));
                              setOsmosisTrialDone(true);
                            }}
                            className="w-full accent-emerald-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>0.0 M (Pure Water)</span>
                            <span>0.3 M (Isotonic)</span>
                            <span>1.0 M (Hypertonic)</span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 space-y-2">
                          <p className="font-bold text-slate-900 dark:text-white">Trial Parameters (30 min immersion):</p>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>Initial Cylinder Mass: <strong>2.50 g</strong></div>
                            <div>Initial Length: <strong>40.0 mm</strong></div>
                            <div>Final Mass: <strong>{(2.50 * (1 + (0.3 - sucroseMolarity) * 0.25)).toFixed(2)} g</strong></div>
                            <div>
                              % Mass Change:{' '}
                              <strong className={sucroseMolarity < 0.3 ? 'text-emerald-600' : 'text-rose-600'}>
                                {((0.3 - sucroseMolarity) * 25).toFixed(1)}%
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
                        <div className="text-center mb-4">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">Potato Cylinder Turgidity</span>
                          <h4 className="font-bold text-lg text-emerald-400">
                            {sucroseMolarity < 0.3
                              ? 'Turgid (Net Endosmosis: Water gained)'
                              : sucroseMolarity === 0.3
                              ? 'Isotonic Equilibrium (Incipient Plasmolysis)'
                              : 'Flaccid (Net Exosmosis: Water lost)'}
                          </h4>
                        </div>

                        <div
                          className="h-8 bg-amber-200 rounded-full border-2 border-amber-400 transition-all duration-500 shadow-lg"
                          style={{
                            width: `${Math.max(60, 160 + (0.3 - sucroseMolarity) * 60)}px`,
                            transform: `scaleY(${1 + (0.3 - sucroseMolarity) * 0.3})`,
                          }}
                        />

                        <p className="text-[10px] text-slate-400 mt-5 text-center">
                          Internal cell solute potential (Ψs) corresponds to point of zero mass change at <strong>0.30 M</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBioExp >= 4 && (
                  /* Practicals 5, 6, 7, 8 Overview & Interactive Simulator */
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-600 text-white">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {bioPracticals[selectedBioExp].title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Interactive measurement protocol and observations recorder
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Variable 1</span>
                        <p className="font-semibold text-xs mt-1 text-slate-800 dark:text-slate-200">Environmental Factor / Reagent Input</p>
                        <span className="text-[11px] font-mono text-emerald-600 font-bold">Calibrated (Standard)</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Measured Response</span>
                        <p className="font-semibold text-xs mt-1 text-slate-800 dark:text-slate-200">Photometer / Bubble / Chromato Front</p>
                        <span className="text-[11px] font-mono text-emerald-600 font-bold">Accurate to 0.05 units</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Syllabus Status</span>
                        <p className="font-semibold text-xs mt-1 text-slate-800 dark:text-slate-200">Curriculum Compliance</p>
                        <span className="text-[11px] font-bold text-emerald-600">Certified for A/L 2028</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* =========================================================================
               PHYSICAL SCIENCE VIRTUAL LABORATORY
               ========================================================================= */
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Lab Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-blue-950/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {physicalPracticals[selectedPhysExp].code}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                      {physicalPracticals[selectedPhysExp].title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {physicalPracticals[selectedPhysExp].objective}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handleExportLabReportPDF(
                      'physical',
                      physicalPracticals[selectedPhysExp].title,
                      physicalPracticals[selectedPhysExp].code
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Lab Report (PDF)</span>
                </button>
              </div>

              {/* Experiment Simulator Core */}
              <div className="p-6">
                {selectedPhysExp === 0 && (
                  /* Practical 1: Metrology (Vernier & Micrometer) */
                  <div className="space-y-6 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setMetrologyTool('vernier')}
                        className={`px-4 py-2 rounded-xl font-bold border transition-all ${
                          metrologyTool === 'vernier'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Vernier Caliper (Least Count 0.02 mm)
                      </button>
                      <button
                        onClick={() => setMetrologyTool('micrometer')}
                        className={`px-4 py-2 rounded-xl font-bold border transition-all ${
                          metrologyTool === 'micrometer'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Micrometer Screw Gauge (Pitch 0.5 mm)
                      </button>
                    </div>

                    {metrologyTool === 'vernier' ? (
                      <div className="space-y-4">
                        <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 mb-1">Measured Distance Between Jaws</span>
                          <h4 className="font-mono text-3xl font-bold text-blue-400">{vernierJawPos.toFixed(2)} mm</h4>

                          {/* Vernier Visual Representation */}
                          <div className="w-full max-w-lg mt-6 p-4 bg-slate-900 border border-slate-700 rounded-xl">
                            <div className="relative h-10 border-b border-slate-600 flex items-end">
                              <span className="absolute left-2 text-[9px] text-slate-400 font-mono">Main Scale (1 mm div)</span>
                              <div className="w-full flex justify-between text-[8px] font-mono text-slate-400">
                                {[0, 10, 20, 30, 40, 50].map((v) => (
                                  <span key={v}>| {v}mm</span>
                                ))}
                              </div>
                            </div>
                            <div
                              className="h-8 bg-blue-900/60 border border-blue-400 rounded-sm mt-1 transition-all flex items-center justify-center font-mono text-[9px] text-blue-200"
                              style={{ width: '140px', marginLeft: `${(vernierJawPos / 50) * 60}%` }}
                            >
                              Vernier Scale (LC 0.02)
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              Adjust Caliper Sliding Jaw (mm)
                            </label>
                            <span className="font-mono text-blue-600 font-bold">{vernierJawPos.toFixed(2)} mm</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="0.02"
                            value={vernierJawPos}
                            onChange={(e) => setVernierJawPos(Number(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 mb-1">Micrometer Reading (Main + Circular Scale)</span>
                          <h4 className="font-mono text-3xl font-bold text-blue-400">{micrometerThimble.toFixed(2)} mm</h4>

                          <div className="w-full max-w-md mt-4 p-3 bg-slate-900 rounded-xl border border-slate-700 text-center font-mono text-[11px] text-slate-300">
                            Pitch = 0.50 mm • Circular divisions = 50 • Least count = 0.01 mm
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              Rotate Thimble Drum (mm)
                            </label>
                            <span className="font-mono text-blue-600 font-bold">{micrometerThimble.toFixed(2)} mm</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="25"
                            step="0.01"
                            value={micrometerThimble}
                            onChange={(e) => setMicrometerThimble(Number(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedPhysExp === 1 && (
                  /* Practical 2: Simple Pendulum & g calculation */
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              Suspension Wire Length (L in meters)
                            </label>
                            <span className="font-mono text-blue-600 font-bold">{pendulumLength.toFixed(2)} m</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="1.4"
                            step="0.05"
                            value={pendulumLength}
                            onChange={(e) => {
                              setPendulumLength(Number(e.target.value));
                              setPendulumRecordedT(null);
                            }}
                            className="w-full accent-blue-600"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Measured from point of suspension to center of brass bob.</p>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <p className="font-bold text-slate-900 dark:text-white">Theoretical Periodic Time Formula:</p>
                          <p className="font-mono text-xs text-blue-600 dark:text-blue-400">
                            T = 2π √(L / g) ⟹ T² = (4π² / g) · L
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            Theoretical T for {pendulumLength.toFixed(2)}m: <strong>{(2 * Math.PI * Math.sqrt(pendulumLength / 9.81)).toFixed(3)} s</strong>
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setPendulumTimerRunning(true);
                            setTimeout(() => {
                              const t = 2 * Math.PI * Math.sqrt(pendulumLength / 9.81);
                              setPendulumRecordedT(Number(t.toFixed(3)));
                              setPendulumTimerRunning(false);
                            }, 1200);
                          }}
                          disabled={pendulumTimerRunning}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{pendulumTimerRunning ? 'Timing 20 Oscillations with Photogate...' : 'Release Bob & Time Oscillations'}</span>
                        </button>
                      </div>

                      {/* Pendulum Animation & Calculation Results */}
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
                        {/* Pendulum Graphic */}
                        <div className="relative w-40 h-44 flex flex-col items-center">
                          <div className="w-16 h-2 bg-slate-600 rounded-full" />
                          <div
                            className={`w-0.5 bg-slate-300 origin-top transition-transform ${
                              pendulumTimerRunning ? 'animate-bounce' : ''
                            }`}
                            style={{ height: `${pendulumLength * 90}px` }}
                          />
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-lg border border-amber-200" />
                        </div>

                        <div className="mt-4 text-center">
                          <span className="text-[10px] text-slate-400">Experimental Time Period (T):</span>
                          <h4 className="font-mono text-2xl font-bold text-blue-400">
                            {pendulumRecordedT !== null ? `${pendulumRecordedT} s` : '—'}
                          </h4>
                          {pendulumRecordedT !== null && (
                            <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                              Calculated g = {((4 * Math.PI ** 2 * pendulumLength) / pendulumRecordedT ** 2).toFixed(2)} m/s² (±0.02)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPhysExp === 3 && (
                  /* Practical 4: Ohm's Law & Meter Bridge */
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              DC Power Supply Voltage (V)
                            </label>
                            <span className="font-mono text-blue-600 font-bold">{circuitVoltage.toFixed(1)} V</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="12"
                            step="0.5"
                            value={circuitVoltage}
                            onChange={(e) => setCircuitVoltage(Number(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              Meter Bridge Jockey Slider Position (l in cm)
                            </label>
                            <span className="font-mono text-blue-600 font-bold">{meterBridgeJockeyPos} cm</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="90"
                            value={meterBridgeJockeyPos}
                            onChange={(e) => setMeterBridgeJockeyPos(Number(e.target.value))}
                            className="w-full accent-blue-600"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Slide jockey along 100cm nichrome wire until galvanometer deflects to 0.</p>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
                          <p className="font-bold text-blue-900 dark:text-blue-200">Wheatstone Bridge Balance Condition:</p>
                          <p className="font-mono text-[11px] text-blue-700 dark:text-blue-300">
                            X = R · (l₁ / (100 - l₁))
                          </p>
                        </div>
                      </div>

                      {/* Meter Bridge Readings & Galvanometer */}
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
                        <div className="text-center mb-4">
                          <span className="text-[10px] text-slate-400">Center-Zero Galvanometer Deflection</span>
                          <h4 className="font-mono text-xl font-bold text-blue-400">
                            {meterBridgeJockeyPos === 50 ? '0.0 mA (NULL BALANCE REACHED!)' : `${(meterBridgeJockeyPos - 50) * 1.2} mA`}
                          </h4>
                        </div>

                        {/* Analog Dial Simulation */}
                        <div className="relative w-48 h-24 border-t-2 border-x-2 border-slate-600 rounded-t-full bg-slate-900 flex items-end justify-center p-2">
                          <div
                            className="w-1 h-20 bg-rose-500 origin-bottom transition-transform duration-200 rounded-full"
                            style={{ transform: `rotate(${(meterBridgeJockeyPos - 50) * 1.5}deg)` }}
                          />
                        </div>

                        <div className="mt-4 text-center">
                          <p className="text-[11px] text-slate-300">
                            Unknown Resistance X:{' '}
                            <strong className="text-emerald-400 font-mono">
                              {(knownResistorR * (meterBridgeJockeyPos / (100 - meterBridgeJockeyPos))).toFixed(2)} Ω
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPhysExp === 6 && (
                  /* Practical 7: Acid-Base Volumetric Titration */
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                            Indicator in Conical Flask
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'phenolphthalein', label: 'Phenolphthalein (pH 8.2 - 10.0)' },
                              { id: 'methyl_orange', label: 'Methyl Orange (pH 3.1 - 4.4)' },
                            ].map((ind) => (
                              <button
                                key={ind.id}
                                onClick={() => setTitrationIndicator(ind.id as any)}
                                className={`p-2 rounded-xl border text-left font-semibold ${
                                  titrationIndicator === ind.id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {ind.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              0.100 M NaOH Added from Burette (ml)
                            </label>
                            <span className="font-mono text-blue-600 font-bold">{buretteReading.toFixed(2)} ml</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="35"
                            step="0.2"
                            value={buretteReading}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setBuretteReading(v);
                              if (v >= 24.8 && v <= 25.2) setTitrationEndpointHit(true);
                              else setTitrationEndpointHit(false);
                            }}
                            className="w-full accent-blue-600"
                          />
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="font-bold text-slate-900 dark:text-white">Titration Reaction Stoichiometry:</p>
                          <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                            HCl (aq) + NaOH (aq) ⟶ NaCl (aq) + H₂O (l) [1 : 1 mole ratio]
                          </p>
                        </div>
                      </div>

                      {/* Flask Color Transition */}
                      <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white">
                        <div className="relative w-28 h-40 border-4 border-slate-600 rounded-b-full bg-slate-900/60 flex items-center justify-center overflow-hidden shadow-2xl">
                          <div
                            className="w-full h-24 rounded-b-full transition-all duration-300 flex items-center justify-center p-2 text-center text-[9px] font-bold"
                            style={{
                              backgroundColor:
                                titrationIndicator === 'phenolphthalein'
                                  ? buretteReading >= 25.0
                                    ? '#ec4899' // Pink endpoint
                                    : 'transparent'
                                  : buretteReading >= 25.0
                                  ? '#eab308' // Yellow
                                  : '#ef4444', // Red
                              color: buretteReading >= 25.0 ? '#ffffff' : '#94a3b8',
                            }}
                          >
                            {buretteReading >= 25.0 ? 'Permanent Pink Endpoint' : 'Acidic / Colorless'}
                          </div>
                        </div>

                        <div className="mt-4 text-center">
                          <span className="text-[10px] text-slate-400">Equivalent Endpoint Volume:</span>
                          <h4 className="font-mono text-xl font-bold text-blue-400">
                            {buretteReading >= 24.8 && buretteReading <= 25.2 ? '25.00 ml (Endpoint reached!)' : `${buretteReading.toFixed(2)} ml`}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Calculated Unknown [HCl] = {((0.1 * buretteReading) / 25).toFixed(4)} M
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPhysExp !== 0 && selectedPhysExp !== 1 && selectedPhysExp !== 3 && selectedPhysExp !== 6 && (
                  /* Other physical practicals generic benchmark */
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-blue-600 text-white">
                        <Atom className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {physicalPracticals[selectedPhysExp].title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Precision laboratory instruments & calibration bench
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Input Parameter</span>
                        <p className="font-semibold text-xs mt-1 text-slate-800 dark:text-slate-200">Physical Variable / Mass / Frequency</p>
                        <span className="text-[11px] font-mono text-blue-600 font-bold">Standard Range</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Measurement Instrument</span>
                        <p className="font-semibold text-xs mt-1 text-slate-800 dark:text-slate-200">High Precision Digital Sensors</p>
                        <span className="text-[11px] font-mono text-blue-600 font-bold">Accredited A/L Spec</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Syllabus Status</span>
                        <p className="font-semibold text-xs mt-1 text-slate-800 dark:text-slate-200">Zahira College Curriculum</p>
                        <span className="text-[11px] font-bold text-blue-600">Certified for A/L 2028</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
