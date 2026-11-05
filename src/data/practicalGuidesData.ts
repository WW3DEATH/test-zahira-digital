export interface PracticalGuide {
  id: string;
  code: string;
  discipline: 'bio' | 'physics' | 'maths' | 'chemistry';
  stream: 'Biological Science' | 'Physical Science';
  subjectName: string;
  title: string;
  duration: string;
  syllabusUnit: string;
  aim: string;
  learningCompetencies: string[];
  apparatus: string[];
  safetyPrecautions: string[];
  theoreticalBackground: string;
  keyFormulas: string[];
  procedureSteps: string[];
  observationColumns: string[];
  checklistSteps: string[];
}

export const PRACTICAL_GUIDES: PracticalGuide[] = [
  // ==========================================
  // COMBINED MATHEMATICS PRACTICALS (NEW)
  // ==========================================
  {
    id: 'math-1',
    code: 'MATH-MECH-01',
    discipline: 'maths',
    stream: 'Physical Science',
    subjectName: 'Combined Mathematics (Applied Maths / Statics)',
    title: 'Lami’s Theorem & Resolution of Coplanar Forces at a Point',
    duration: '45 mins',
    syllabusUnit: 'Unit 4: Statics of Coplanar Equilibrium',
    aim: 'Verify the equilibrium of three coplanar concurrent forces and validate Lami’s Theorem: P/sin(α) = Q/sin(β) = R/sin(γ).',
    learningCompetencies: [
      'Resolve coplanar forces along orthogonal Cartesian axes (ΣFx = 0, ΣFy = 0)',
      'Construct closed vector force polygons for equilibrium',
      'Validate Lami’s Theorem experimentally using weight hangers and smooth pulleys',
      'Account for string friction and knot weight experimental uncertainties'
    ],
    apparatus: [
      'Vertical Gravesand’s Force Board with white paper sheet',
      '2 clamp-on frictionless ball-bearing pulleys',
      'Light inelastic string with central brass ring',
      '3 slotted mass hangers with 50g and 100g calibrated weights',
      'Large 360° protractor, set-squares, drawing pins, and sharp 2H pencil'
    ],
    safetyPrecautions: [
      'Ensure slotted masses are securely hooked to prevent accidental fall injury',
      'Avoid standing directly beneath heavy weights (1.5 kg+)',
      'Ensure pulleys are clamped firmly to prevent sudden release of tension'
    ],
    theoreticalBackground:
      'If three coplanar forces acting at a point are in static equilibrium, each force is directly proportional to the sine of the angle between the other two forces: P / sin(α) = Q / sin(β) = R / sin(γ). Furthermore, resolving horizontally and vertically yields ΣFx = P·cos(θ₁) + Q·cos(θ₂) + R·cos(θ₃) = 0 and ΣFy = P·sin(θ₁) + Q·sin(θ₂) + R·sin(θ₃) = 0.',
    keyFormulas: [
      'Lami’s Theorem: P / sin(α) = Q / sin(β) = R / sin(γ)',
      'Horizontal Equilibrium: ΣFx = 0',
      'Vertical Equilibrium: ΣFy = 0',
      'Resultant of Two Forces: R = √(P² + Q² + 2PQ·cos(θ))'
    ],
    procedureSteps: [
      'Clamp the force board vertically and mount two smooth pulleys at the upper corners.',
      'Tie three light strings to a small center ring. Pass two strings over the pulleys and let the third hang vertically.',
      'Suspend known slotted masses P, Q, and R from the string ends.',
      'Gently displace the central ring and tap the board to overcome any negligible pulley bearing friction.',
      'Once in equilibrium, use drawing pins to align pins along the three strings to mark their directions on the paper.',
      'Remove the paper, extend the lines of action of the three tensions, and measure angles α, β, and γ with the protractor.',
      'Compute P/sin(α), Q/sin(β), and R/sin(γ) and compare their numerical ratio.'
    ],
    observationColumns: ['Trial', 'Mass P (g)', 'Mass Q (g)', 'Mass R (g)', 'Angle α (°)', 'Angle β (°)', 'Angle γ (°)', 'P/sin(α)', 'Q/sin(β)', 'R/sin(γ)'],
    checklistSteps: [
      'Verify Gravesand force board is leveled vertically with a spirit level',
      'Check string lightness and ensure smooth pulley rotation without stickiness',
      'Record masses P, Q, and R with digital balance zero-error confirmation',
      'Mark ray directions without parallax error using pin shadow method',
      'Measure angles α, β, and γ with calibrated protractor (ensure α + β + γ = 360°)',
      'Compute Lami ratios and confirm equality within ±3% experimental tolerance',
      'Document findings in the official Zahira College practical record log'
    ]
  },
  {
    id: 'math-2',
    code: 'MATH-MECH-02',
    discipline: 'maths',
    stream: 'Physical Science',
    subjectName: 'Combined Mathematics (Applied Maths / Mechanics)',
    title: 'Limiting Friction & Angle of Repose on an Adjustable Inclined Plane',
    duration: '40 mins',
    syllabusUnit: 'Unit 5: Friction & Limiting Equilibrium',
    aim: 'Determine the coefficient of static limiting friction (μs) between wood, rubber, and steel surfaces by measuring the critical angle of repose (θc).',
    learningCompetencies: [
      'Derive the limiting equilibrium condition on an inclined plane: tan(θc) = μs',
      'Resolve weight components normal (R = mg·cosθ) and parallel (F = mg·sinθ) to the plane',
      'Differentiate between static, limiting, and kinetic friction regimes',
      'Construct linear graph of F vs R to find gradient μ'
    ],
    apparatus: [
      'Adjustable inclined plane with protractor scale and spirit level',
      'Rectangular slider blocks with interchangeable faces (Wood, Rubber, Polished Steel)',
      'Light frictionless pulley attached to top of plane',
      'Scale pan, fine cord, and slotted fractional masses (1g to 50g)',
      'Digital vernier protractor (0.1° accuracy) and electronic balance'
    ],
    safetyPrecautions: [
      'Prevent slider block from sliding off the edge by securing a buffer stop',
      'Ensure weights in the scale pan do not swing during tilt adjustments'
    ],
    theoreticalBackground:
      'For a body resting on an inclined plane of angle θ, the normal reaction is R = mg·cos(θ) and the gravitational component urging it downwards is mg·sin(θ). As θ increases, the friction force F increases until it reaches its limiting value F_max = μs·R. At impending motion (critical angle θc), mg·sin(θc) = μs·mg·cos(θc), which simplifies to μs = tan(θc).',
    keyFormulas: [
      'Angle of Repose: μs = tan(θc)',
      'Normal Reaction: R = m·g·cos(θ)',
      'Downhill Force: F_down = m·g·sin(θ)',
      'Limiting Friction Law: F_max = μs · R'
    ],
    procedureSteps: [
      'Place the inclined plane on a sturdy horizontal workbench and level its base.',
      'Place the wooden block on the plane and gradually raise the incline using the screw elevation mechanism.',
      'Tap the plane gently to eliminate microscopic surface stiction.',
      'Record the exact angle θc at which the block just begins to slide down with uniform motion.',
      'Repeat the measurement 5 times and calculate the mean critical angle θc.',
      'Compute the coefficient of static friction: μs = tan(θc).',
      'Repeat for different surface pairings (Rubber on Wood, Steel on Wood) and mass variations.'
    ],
    observationColumns: ['Trial', 'Surface Pair', 'Mass (g)', 'Critical Angle θc (°)', 'cos(θc)', 'sin(θc)', 'Calculated μs = tan(θc)'],
    checklistSteps: [
      'Clean plane and block contact surfaces with a dry microfiber cloth to remove dust',
      'Level the plane base to 0.0° before initiating elevation',
      'Perform 5 independent angle of repose trials with gentle tapping',
      'Compute mean critical angle and standard deviation uncertainty',
      'Plot F = mg·sin(θ) against R = mg·cos(θ) and find gradient',
      'Verify that μs is independent of the contact surface area'
    ]
  },
  {
    id: 'math-3',
    code: 'MATH-MECH-03',
    discipline: 'maths',
    stream: 'Physical Science',
    subjectName: 'Combined Mathematics (Applied Maths / Dynamics)',
    title: 'Projectile Motion: Trajectory Parabola, Maximum Height & Range',
    duration: '50 mins',
    syllabusUnit: 'Unit 6: Kinematics of Projectiles in a Plane',
    aim: 'Investigate the parabolic trajectory of a projectile launched at speed u and elevation angle α, and experimentally confirm the range R = (u²·sin(2α))/g.',
    learningCompetencies: [
      'Decompose 2D projectile kinematics into horizontal constant velocity (ux = u·cosα) and vertical gravitational acceleration (uy = u·sinα - gt)',
      'Derive Cartesian trajectory equation: y = x·tan(α) - (g·x²)/(2u²·cos²(α))',
      'Analyze maximum horizontal range condition at α = 45°',
      'Quantify air resistance deviations and experimental projectile landing errors'
    ],
    apparatus: [
      'Spring-loaded ballistic projectile launcher with photogate speed sensors',
      'Plumb line, 2-meter steel measuring tape, and carbon paper landing sheets',
      'Angle indicator scale (0° to 90° with 1° graduations)',
      'Steel spheres of uniform diameter (16 mm, 25g)',
      'Digital millisecond timer interface'
    ],
    safetyPrecautions: [
      'Wear safety glasses during projectile launch trials',
      'Ensure the firing trajectory path and landing zone are clear of personnel',
      'Never look down the launcher barrel'
    ],
    theoreticalBackground:
      'Ignoring air drag, horizontal displacement is x = (u·cosα)·t, and vertical displacement is y = (u·sinα)·t - 0.5·g·t². Eliminating t yields the parabolic trajectory y = x·tan(α) - [g / (2u²·cos²α)]·x². The horizontal range is R = (u²·sin2α)/g, reaching its maximum R_max = u²/g when α = 45°. The time of flight is T = (2u·sinα)/g and maximum height is H = (u²·sin²α)/(2g).',
    keyFormulas: [
      'Trajectory: y = x·tan(α) - [g·x²] / [2·u²·cos²(α)]',
      'Horizontal Range: R = [u² · sin(2α)] / g',
      'Maximum Height: H = [u² · sin²(α)] / (2g)',
      'Time of Flight: T = [2u · sin(α)] / g'
    ],
    procedureSteps: [
      'Clamp the launcher horizontally and fire 5 calibration shots through the photogates to determine initial muzzle speed u.',
      'Set the launch angle to α = 15° and place white paper covered with carbon paper in the estimated landing zone.',
      'Launch the steel ball and record the landing spot mark created on the paper.',
      'Measure horizontal distance R from the plumb line below the launch point to the center of the landing impact.',
      'Repeat for angles α = 30°, 45°, 60°, and 75° at the same compression setting.',
      'Plot Range R against sin(2α) and verify straight-line proportionality passing through origin.'
    ],
    observationColumns: ['Trial', 'Angle α (°)', '2α (°)', 'sin(2α)', 'Measured Range R (m)', 'Theoretical Range R_th (m)', '% Discrepancy'],
    checklistSteps: [
      'Calibrate photogate sensor spacing and record muzzle velocity u',
      'Drop plumb line to mark initial launching coordinate origin x = 0',
      'Perform 3 trials for each angle to calculate mean impact coordinate',
      'Observe complementary angle symmetry: Range at 30° ≈ Range at 60°',
      'Plot R vs sin(2α) graph and determine experimental gravity g from slope',
      'Complete lab worksheet with error analysis for air resistance effects'
    ]
  },
  {
    id: 'math-4',
    code: 'MATH-CALC-01',
    discipline: 'maths',
    stream: 'Physical Science',
    subjectName: 'Combined Mathematics (Pure Maths / Calculus)',
    title: 'Numerical Quadrature: Simpson’s 1/3 Rule Area Approximation',
    duration: '40 mins',
    syllabusUnit: 'Unit 9: Definite Integrals & Numerical Methods',
    aim: 'Apply Simpson’s 1/3 Rule to approximate definite integrals of non-linear functions with n strips and evaluate convergence against analytical calculus solutions.',
    learningCompetencies: [
      'Understand parabolic arc interpolation over pairs of subintervals',
      'Apply Simpson’s formula: ∫[a,b] f(x)dx ≈ (h/3)[y0 + 4(y1 + y3 + ...) + 2(y2 + y4 + ...) + yn]',
      'Compare truncation error order O(h⁴) of Simpson’s rule versus Trapezoidal rule O(h²)',
      'Calculate percentage error against exact analytical anti-derivative: |I_exact - I_num| / I_exact × 100%'
    ],
    apparatus: [
      'Graph paper, 0.5mm precision ruler, and programmable scientific calculator',
      'Tabulated ordinate data sheets for test curves y = x², y = 4 - x², and y = sin(x) + 1',
      'Digital numerical integration simulator terminal'
    ],
    safetyPrecautions: [
      'Ensure calculation step sizes are non-zero (h = (b - a)/n > 0)',
      'Ensure number of strips n is an even integer for Simpson’s 1/3 Rule'
    ],
    theoreticalBackground:
      'Simpson’s 1/3 rule models the curve through consecutive triplets of points (x_{i-1}, y_{i-1}), (x_i, y_i), (x_{i+1}, y_{i+1}) using a quadratic Lagrange polynomial. Over [a, b] divided into an even number n of intervals of width h = (b - a)/n, the area is given by I ≈ (h/3)[y_0 + 4·Σ(y_odd) + 2·Σ(y_even) + y_n]. Because quadratic polynomials match parabolas exactly, Simpson’s rule integrates cubics and quadratics with zero theoretical truncation error.',
    keyFormulas: [
      'Step Width: h = (b - a) / n  (where n must be even)',
      'Simpson’s Rule: I ≈ (h/3) · [y_0 + 4·(y_1 + y_3 + ...) + 2·(y_2 + y_4 + ...) + y_n]',
      'Analytical Integral: I_exact = F(b) - F(a)',
      'Percentage Relative Error: E% = (|I_exact - I_approx| / I_exact) × 100%'
    ],
    procedureSteps: [
      'Select continuous test function f(x) = 4 - x² on the interval [a, b] = [0, 2].',
      'Compute the analytical integral: ∫[0,2] (4 - x²) dx = [4x - x³/3] from 0 to 2 = 16/3 ≈ 5.3333.',
      'Divide the interval into n = 2 strips (h = 1.0). Evaluate y0 = f(0), y1 = f(1), y2 = f(2).',
      'Apply formula: I_2 = (1/3)[4 + 4(3) + 0] = 16/3 = 5.3333 (0.00% error).',
      'Repeat with n = 4 strips (h = 0.5) and n = 6 strips for f(x) = sin(x) + 1 on [0, π].',
      'Tabulate ordinates, compute approximations, and compare convergence rates.'
    ],
    observationColumns: ['Interval [a, b]', 'Strips n', 'Step h', 'Sum Odd Ordinates', 'Sum Even Ordinates', 'Simpson Area', 'Analytic Area', 'Error %'],
    checklistSteps: [
      'Confirm subinterval width h = (b - a)/n is uniform across all segments',
      'Verify n is strictly an even integer (n = 2, 4, 6, 8, ...)',
      'Evaluate ordinates y_i with at least 5 decimal places precision',
      'Apply correct weighting factors: 1 for ends, 4 for odd, 2 for even ordinates',
      'Compare numerical result against exact indefinite integral value',
      'Graph ordinates and shade interpolated parabolic panels'
    ]
  },
  {
    id: 'math-5',
    code: 'MATH-MECH-04',
    discipline: 'maths',
    stream: 'Physical Science',
    subjectName: 'Combined Mathematics (Applied Maths / Mechanics)',
    title: 'Center of Gravity (C.G.) of Laminas & Composite Systems',
    duration: '45 mins',
    syllabusUnit: 'Unit 7: Center of Gravity & Rigid Body Equilibrium',
    aim: 'Experimentally locate the center of gravity of irregular and composite laminas using plumb-line suspensions, and verify centroid coordinates (x̄, ȳ) = (ΣA_i·x_i / ΣA_i, ΣA_i·y_i / ΣA_i).',
    learningCompetencies: [
      'Locate centroid experimentally using multi-point plumb-line triangulation',
      'Calculate theoretical center of gravity of composite geometric shapes (triangles, rectangles, circles)',
      'Account for negative area removal (punched holes or cut-outs)',
      'Demonstrate neutral, stable, and unstable equilibrium states relative to suspension axis'
    ],
    apparatus: [
      'Rigid cardboard / acrylic composite laminas (T-shape, L-shape, triangle with circular hole)',
      'Fine suspension needle pin mounted on rigid retort stand clamp',
      'Plumb-bob with fine suspension thread',
      'Digital calipers, millimeter ruler, and sharp 0.3mm mechanical pencil',
      'Electronic mass balance (0.01g precision)'
    ],
    safetyPrecautions: [
      'Handle mounting needle pins carefully to avoid puncture injuries',
      'Ensure retort stand is weighted at the base to prevent tipping'
    ],
    theoreticalBackground:
      'The center of gravity (C.G.) of a uniform flat lamina of surface density σ lies at its geometric centroid. When freely suspended from a pivot pin, the only external forces are the pivot reaction and gravity; therefore, the center of gravity must lie vertically below the suspension point along the plumb line. The intersection of plumb lines drawn from three non-collinear suspension points uniquely identifies the C.G.',
    keyFormulas: [
      'Composite X-Centroid: x̄ = (Σ A_i · x_i) / (Σ A_i)',
      'Composite Y-Centroid: ȳ = (Σ A_i · y_i) / (Σ A_i)',
      'Triangle Centroid: Distance 1/3 of median from base',
      'Negative Area Correction: x̄ = (A₁·x₁ - A₂·x₂) / (A₁ - A₂)'
    ],
    procedureSteps: [
      'Cut an L-shaped composite lamina from a uniform sheet of stiff cardboard.',
      'Pierce 3 small holes (A, B, C) near the perimeter well separated from each other.',
      'Suspend the lamina from hole A on the horizontal pivot needle and hang the plumb line in front of it.',
      'Once oscillation stops, mark two points on the lamina along the plumb line and rule a pencil line.',
      'Repeat the suspension from holes B and C, ruling plumb lines for each.',
      'Observe the intersection point G of all three plumb lines.',
      'Balance the lamina horizontally on the flat tip of a pencil eraser at point G to verify equilibrium.',
      'Measure physical coordinates of G and compare with theoretical centroid equations.'
    ],
    observationColumns: ['Lamina Part', 'Area Ai (cm²)', 'xi from origin (cm)', 'yi from origin (cm)', 'Ai·xi', 'Ai·yi', 'Theoretical G (cm)', 'Observed G (cm)'],
    checklistSteps: [
      'Verify uniform thickness and density of lamina material',
      'Ensure suspension holes allow frictionless swinging without binding',
      'Mark plumb lines only after pendulum oscillation has completely settled',
      'Verify that all 3 suspension lines intersect at a single concurrent point G',
      'Balance lamina horizontally on a pin tip to confirm C.G. location',
      'Compare experimental (x̄, ȳ) with mathematical area-weighted moment values'
    ]
  },

  // ==========================================
  // PHYSICAL SCIENCE / PHYSICS PRACTICALS
  // ==========================================
  {
    id: 'phys-1',
    code: 'PHYS-PRAC-01',
    discipline: 'physics',
    stream: 'Physical Science',
    subjectName: 'Physics (Metrology & Units)',
    title: 'Precision Metrology: Vernier Caliper & Micrometer Screw Gauge',
    duration: '45 mins',
    syllabusUnit: 'Unit 1: Measurement & Dimensional Metrology',
    aim: 'Master mechanical metrology instruments, calibrate zero errors (positive and negative), and measure dimensions of solid cylinders and fine wires with 0.01 mm precision.',
    learningCompetencies: [
      'Calculate Least Count (LC) of vernier caliper: LC = 1 MSD - 1 VSD = 0.1 mm / 0.02 mm',
      'Calculate Least Count of micrometer screw gauge: Pitch / Total Thimble Divisions = 0.5 mm / 50 = 0.01 mm',
      'Identify and apply positive and negative zero errors: True Reading = Observed Reading - Zero Error',
      'Compute volume and density of solid cylinder with compounded fractional error propagation'
    ],
    apparatus: [
      'Precision Vernier Caliper (0.02 mm / 0.1 mm accuracy)',
      'Digital and mechanical Micrometer Screw Gauge (0 - 25 mm, 0.01 mm pitch)',
      'Solid brass cylinder, glass sphere, and calibrated nichrome wire specimen',
      'Electronic digital balance (0.001 g accuracy)',
      'Magnifying loupe for vernier scale coincidence reading'
    ],
    safetyPrecautions: [
      'Never overtighten micrometer thimble; always use the ratchet stop to avoid crushing the specimen',
      'Keep caliper jaws clean from grit to prevent zero error shift'
    ],
    theoreticalBackground:
      'The vernier caliper allows reading fractions of the main scale division by aligning n vernier divisions with (n-1) main scale divisions. The micrometer screw gauge uses the principle of a screw: one full revolution of the thimble advances the spindle by the pitch (usually 0.5 mm). If the zero of the circular scale does not coincide with the reference line when jaws meet, zero error must be algebraically subtracted from all observed readings.',
    keyFormulas: [
      'Vernier Least Count: LC = 1 MSD - 1 VSD',
      'Micrometer Least Count: LC = Pitch / (Number of Head Divisions)',
      'Correct Reading = Observed Reading - (± Zero Error)',
      'Cylinder Volume: V = π · (d/2)² · L',
      'Fractional Uncertainty: ΔV/V = 2(Δd/d) + (ΔL/L)'
    ],
    procedureSteps: [
      'Inspect jaws of vernier caliper; close gently and record zero error if any.',
      'Place brass cylinder between lower jaws and read main scale and coincident vernier division.',
      'Take measurements at 3 different orientations along the cylinder length and diameter.',
      'Inspect micrometer screw gauge; turn ratchet stop until jaws click and record zero error.',
      'Insert fine nichrome wire between anvil and spindle; rotate ratchet until it clicks 3 times.',
      'Record main pitch scale and rotating thimble reading; apply zero correction.',
      'Calculate volume and density of cylinder and cross-sectional area of wire.'
    ],
    observationColumns: ['Measurement', 'Main Scale Reading', 'Vernier/Thimble Reading', 'Observed Value (mm)', 'Zero Error (mm)', 'Corrected Value (mm)'],
    checklistSteps: [
      'Clean jaw surfaces with lens paper before taking zero readings',
      'Inspect for positive or negative zero error and note sign explicitly',
      'Always use ratchet mechanism on micrometer to ensure constant contact pressure',
      'Take 3 diameter readings at orthogonal axes to check for ovality',
      'Calculate mean corrected dimension and express with appropriate significant figures'
    ]
  },
  {
    id: 'phys-2',
    code: 'PHYS-PRAC-02',
    discipline: 'physics',
    stream: 'Physical Science',
    subjectName: 'Physics (Mechanics & Oscillations)',
    title: 'Simple Pendulum & Gravitational Acceleration (g)',
    duration: '40 mins',
    syllabusUnit: 'Unit 2: Oscillations & Gravitation',
    aim: 'Determine the local acceleration due to gravity (g) in Mawanella, Sri Lanka, by measuring oscillation periods of a simple pendulum across variable lengths and plotting T² vs L.',
    learningCompetencies: [
      'Demonstrate isochronism of small amplitude oscillations (θ < 5°)',
      'Derive period equation: T = 2π√(L/g) ⟹ T² = (4π²/g)·L',
      'Plot linear T² versus L graph and determine gravitational acceleration g = 4π² / gradient',
      'Account for string mass, air damping, and finite bob radius corrections'
    ],
    apparatus: [
      'Heavy spherical brass bob with small attachment hook',
      'Light, inextensible unspun cotton thread (length 0.3 m to 1.3 m)',
      'Split cork clamp attached to heavy retort stand base',
      'High-precision digital photogate timer and stopwatch (0.01 s)',
      '2-meter steel ruler and vernier calipers to measure bob diameter'
    ],
    safetyPrecautions: [
      'Ensure retort stand base is clamped or weighted to prevent rocking during swing',
      'Keep oscillation amplitude small (under 5°) to prevent harmonic non-linearity'
    ],
    theoreticalBackground:
      'For small angular displacements, restoring torque is τ = -mgL·sin(θ) ≈ -mgL·θ, leading to simple harmonic motion with angular frequency ω = √(g/L). The period is T = 2π√(L/g). Squaring both sides yields T² = (4π²/g)·L. Plotting T² against L produces a straight line passing through the origin with gradient m = 4π²/g, from which g = 4π²/m.',
    keyFormulas: [
      'Period: T = 2π · √(L / g)',
      'Linear Form: T² = (4π² / g) · L',
      'Gravity: g = 4π² / (Slope of T² vs L graph)',
      'Effective Length: L = Length of string + Radius of bob'
    ],
    procedureSteps: [
      'Measure diameter of brass bob with vernier calipers to determine radius r.',
      'Clamp pendulum thread tightly between split cork at effective length L = 1.00 m (distance from clamp to center of bob).',
      'Displace bob by less than 5° and release without imparting any lateral spin.',
      'Record time for 20 complete oscillations using stopwatch or photogate timer.',
      'Repeat timing once more to compute mean time for 20 oscillations and calculate period T.',
      'Decrease effective length L by 0.10 m decrements down to 0.40 m, repeating timings for each.',
      'Plot T² on y-axis against L on x-axis; determine gradient and compute g.'
    ],
    observationColumns: ['Effective Length L (m)', 'Time for 20 Oscillations t1 (s)', 'Time t2 (s)', 'Mean t (s)', 'Period T (s)', 'T² (s²)'],
    checklistSteps: [
      'Measure bob radius accurately with calipers and add to string length for effective L',
      'Verify split cork holds thread firmly at sharp pivot point without slip',
      'Confirm swing amplitude is strictly below 5° (approx 5 cm lateral displacement)',
      'Time at least 20 full cycles to minimize reaction time error',
      'Plot linear T² vs L line of best fit and compute gradient with rise/run method',
      'Verify derived value of g is within 9.78 - 9.82 m/s² for Sri Lanka'
    ]
  },
  {
    id: 'phys-3',
    code: 'PHYS-PRAC-03',
    discipline: 'physics',
    stream: 'Physical Science',
    subjectName: 'Physics (Mechanical Properties of Matter)',
    title: 'Hooke’s Law & Young’s Modulus via Searle’s Apparatus',
    duration: '50 mins',
    syllabusUnit: 'Unit 3: Elasticity & Solid Mechanics',
    aim: 'Measure the tensile elongation of a steel wire under increasing load and determine Young’s Modulus: Y = (F·L) / (A·ΔL).',
    learningCompetencies: [
      'Compensate for thermal expansion and frame flexure using reference wire mechanism',
      'Measure microscopic wire elongation using spirit level micrometer',
      'Construct Stress vs Strain curve and verify linear elastic Hooke’s region',
      'Compute Young’s Modulus Y = (4·M·g·L) / (π·d²·ΔL)'
    ],
    apparatus: [
      'Searle’s apparatus with twin suspension wires (experimental wire and reference wire)',
      'Spirit level hinged between experimental and reference frames',
      'Spherometer-type micrometer screw (0.01 mm precision)',
      'Set of slotted weights (0.5 kg to 5.0 kg with hangers)',
      'Micrometer screw gauge to measure wire diameter d and steel tape for wire length L'
    ],
    safetyPrecautions: [
      'Do not exceed yield stress of wire (do not load beyond 5 kg)',
      'Lower weights gently onto hanger to prevent impulse shock breaking the wire'
    ],
    theoreticalBackground:
      'Tensile stress is defined as σ = F/A and tensile strain as ε = ΔL/L. By Hooke’s law, within the proportional limit, stress is proportional to strain: σ = Y·ε, where Y is Young’s Modulus. In Searle’s apparatus, two identical wires are hung from the same rigid ceiling mount to eliminate ambient thermal expansion errors.',
    keyFormulas: [
      'Tensile Stress: σ = F / A = (M·g) / [π·(d/2)²]',
      'Tensile Strain: ε = ΔL / L',
      'Young’s Modulus: Y = (M·g·L) / [ (π·d²/4) · ΔL ]',
      'Gradient: Slope of M vs ΔL graph ⟹ Y = (g·L / A) · Gradient'
    ],
    procedureSteps: [
      'Measure total length L of experimental wire from top clamp to lower frame.',
      'Measure wire diameter d at 6 different locations using micrometer screw gauge and compute mean d.',
      'Place initial zero-load on experimental wire to keep it taut and straight.',
      'Turn the micrometer screw until the spirit level bubble is centered; record baseline reading.',
      'Add 0.5 kg mass to hanger; turn micrometer until bubble is centered again and record reading.',
      'Continue adding 0.5 kg masses up to 4.5 kg, recording elongation ΔL at each step.',
      'Unload masses in reverse order to verify absence of permanent plastic deformation (hysteresis).',
      'Plot Load M vs Extension ΔL and evaluate Young’s Modulus from slope.'
    ],
    observationColumns: ['Load Mass M (kg)', 'Micrometer Loading (mm)', 'Micrometer Unloading (mm)', 'Mean Reading (mm)', 'Extension ΔL (mm)'],
    checklistSteps: [
      'Record wire diameter at 5 points with micrometer zero-error compensation',
      'Ensure reference wire and test wire are suspended from same ceiling bracket',
      'Center spirit level bubble gently without tapping micrometer drum',
      'Take readings both on loading and unloading to verify elasticity',
      'Plot M vs ΔL straight line through origin and calculate slope'
    ]
  },
  {
    id: 'phys-4',
    code: 'PHYS-PRAC-04',
    discipline: 'physics',
    stream: 'Physical Science',
    subjectName: 'Physics (Current Electricity)',
    title: 'Ohm’s Law & Resistance / Resistivity via Meter Bridge',
    duration: '50 mins',
    syllabusUnit: 'Unit 4: Direct Current Circuits & Bridges',
    aim: 'Determine unknown resistance X and electrical resistivity ρ of a metallic conductor using a calibrated Wheatstone Meter Bridge: X = R·(l₁ / (100 - l₁)).',
    learningCompetencies: [
      'Understand Wheatstone bridge null deflection balance condition: P/Q = R/S',
      'Locate balance point l₁ along 1-meter uniform resistance wire with center-zero galvanometer',
      'Optimize balance point near 50 cm to minimize fractional end-correction errors',
      'Compute resistivity: ρ = (X · π · d²) / (4 · L)'
    ],
    apparatus: [
      '1-meter Wheatstone slide-wire bridge with copper strips and brass terminals',
      'Regulated 2V - 4V DC power supply or lead-acid accumulator',
      'Center-zero sensitive galvanometer with protective series resistor shunt',
      'Calibrated resistance box (1 Ω to 100 Ω)',
      'Knife-edge sliding jockey, unknown resistance coil X, and micrometer screw gauge'
    ],
    safetyPrecautions: [
      'Never scrape jockey along bridge wire; lift and place gently to avoid thinning the wire',
      'Keep keys open when not taking readings to avoid Joule heating of bridge wire'
    ],
    theoreticalBackground:
      'The Wheatstone bridge consists of four resistors. When no current flows through the galvanometer, the bridge is balanced: R_left / R_right = l₁ / (100 - l₁). If known resistance R is in left gap and unknown X in right gap, X = R·[(100 - l₁) / l₁]. Knowing length L and diameter d of unknown wire, resistivity is calculated via X = ρ·(L/A) ⟹ ρ = (X·A)/L.',
    keyFormulas: [
      'Bridge Balance: X = R · [(100 - l₁) / l₁]',
      'Cross-Sectional Area: A = π · (d / 2)²',
      'Resistivity: ρ = (X · A) / L',
      'Conductivity: σ = 1 / ρ'
    ],
    procedureSteps: [
      'Connect circuit according to standard Wheatstone bridge layout with known R in left gap and unknown X in right gap.',
      'Set R = 5 Ω on resistance box. Touch jockey at 5 cm and 95 cm to verify opposing galvanometer deflections.',
      'Slide jockey along wire to locate null point where galvanometer indicates exactly zero current.',
      'Record balancing length l₁ from left end. Calculate balancing length l₂ = 100 - l₁.',
      'Repeat for R = 8 Ω, 10 Ω, 12 Ω, and 15 Ω, keeping balance point between 40 cm and 60 cm.',
      'Interchange positions of R and X to eliminate end errors and compute mean resistance X.',
      'Measure wire length L with meter ruler and diameter d with micrometer screw gauge to compute resistivity ρ.'
    ],
    observationColumns: ['Known R (Ω)', 'Balance Length l1 (cm)', 'Length l2 = 100-l1 (cm)', 'Calculated X (Ω)', 'Interchanged X (Ω)', 'Mean X (Ω)'],
    checklistSteps: [
      'Check tight contact screws at all brass copper strips to eliminate contact resistance',
      'Verify two-way deflection at extremes of wire before seeking null point',
      'Touch jockey perpendicularly without sliding to protect wire uniformity',
      'Ensure null point is located near central 50 cm region (40 - 60 cm)',
      'Interchange left and right gap resistors to cancel asymmetric end errors',
      'Measure wire diameter with micrometer at 3 locations'
    ]
  },

  // ==========================================
  // CHEMISTRY PRACTICALS
  // ==========================================
  {
    id: 'chem-1',
    code: 'CHEM-PRAC-01',
    discipline: 'chemistry',
    stream: 'Physical Science',
    subjectName: 'Chemistry (Analytical Chemistry)',
    title: 'Volumetric Acid-Base Titration (0.100 M NaOH vs Unknown HCl)',
    duration: '50 mins',
    syllabusUnit: 'Unit 5: Volumetric Stoichiometry & Equivalence Points',
    aim: 'Standardize an unknown hydrochloric acid solution using 0.100 M sodium hydroxide and phenolphthalein indicator, determining molarity via C1V1 = C2V2.',
    learningCompetencies: [
      'Rinse and prepare precision volumetric glassware (pipette, burette, conical flask)',
      'Deliver reproducible 25.00 ml aliquots using volumetric transfer pipette',
      'Control burette stopcock for single-drop titrant delivery near equivalence point',
      'Identify sharp color transition endpoint: colorless to permanent faint pink'
    ],
    apparatus: [
      '50.00 ml precision class A burette with Teflon stopcock and retort stand clamp',
      '25.00 ml volumetric transfer pipette with safety pipette filler bulb',
      '250 ml Erlenmeyer conical flasks, white ceramic titration tile, and wash bottle',
      'Standardized 0.100 M NaOH solution and unknown HCl solution',
      'Phenolphthalein indicator solution (0.1% in ethanol) and methyl orange'
    ],
    safetyPrecautions: [
      'Wear safety glasses and laboratory lab coat; NaOH and HCl are corrosive',
      'In case of skin contact, flush immediately with copious cold running water',
      'Never pipette by mouth; always use rubber safety suction bulb'
    ],
    theoreticalBackground:
      'Neutralization reaction: HCl (aq) + NaOH (aq) ⟶ NaCl (aq) + H₂O (l). At the stoichiometric equivalence point, moles of H⁺ equal moles of OH⁻: C_acid · V_acid = C_base · V_base. Phenolphthalein is colorless in acidic solution (pH < 8.2) and turns faint pink in basic solution (pH 8.2 - 10.0). Three concordant burette readings agreeing within ±0.05 ml establish reliable analyte concentration.',
    keyFormulas: [
      'Stoichiometry: HCl + NaOH ⟶ NaCl + H₂O  (1:1 ratio)',
      'Molarity Equivalence: C_acid · V_acid = C_base · V_base',
      'Analyte Molarity: C_acid = (C_base · V_base) / V_acid',
      'Concordant Titre Criteria: |V₁ - V₂| ≤ 0.05 ml'
    ],
    procedureSteps: [
      'Rinse burette with small portions of distilled water, followed by standardized 0.100 M NaOH solution.',
      'Fill burette with NaOH; eliminate air bubble from tip, and adjust meniscus to exactly 0.00 ml.',
      'Rinse 25.00 ml pipette with distilled water then with unknown HCl solution.',
      'Pipette exactly 25.00 ml of HCl into clean conical flask; add 2 drops of phenolphthalein indicator.',
      'Place flask on white tile beneath burette tip.',
      'Perform rapid rough titration to find approximate endpoint volume.',
      'Perform careful dropwise titrations, swirling flask continuously, until single drop causes permanent faint pink color persisting for 30 seconds.',
      'Repeat until 3 concordant titres (within 0.05 ml) are obtained; calculate mean volume and HCl molarity.'
    ],
    observationColumns: ['Titration Run', 'Initial Burette Reading (ml)', 'Final Burette Reading (ml)', 'Titre Volume (ml)', 'Concordant Status'],
    checklistSteps: [
      'Rinse burette with titrant and pipette with analyte before loading',
      'Check burette tip for trapped air bubble and tap to dislodge before reading',
      'Read lower meniscus at eye level to eliminate parallax error',
      'Use white tile background beneath flask to detect earliest permanent pale pink tinge',
      'Obtain at least 3 concordant titres within ±0.05 ml variance',
      'Calculate mean titre and compute unknown acid molarity to 4 significant figures'
    ]
  },

  // ==========================================
  // BIOLOGICAL SCIENCE PRACTICALS
  // ==========================================
  {
    id: 'bio-1',
    code: 'BIO-PRAC-01',
    discipline: 'bio',
    stream: 'Biological Science',
    subjectName: 'Biology (Cytology & Histology)',
    title: 'Light Microscopy & Cytological Staining (Onion, Cheek & Blood Cells)',
    duration: '45 mins',
    syllabusUnit: 'Unit 2: Cell Biology & Cytology',
    aim: 'Prepare temporary wet mounts of plant epidermal and animal epithelial tissues, stain with vital dyes, and observe cytological organelles under high power (400x).',
    learningCompetencies: [
      'Operate compound light microscope (coarse/fine focus, condenser iris diaphragm, objective lenses 4x, 10x, 40x, 100x)',
      'Prepare bubble-free temporary wet mounts using 45° coverslip technique',
      'Apply differential cytological stains: Iodine for plant starch/walls, Methylene Blue for animal nuclei',
      'Calculate total magnification: M_total = M_ocular × M_objective and estimate real cell diameter'
    ],
    apparatus: [
      'Compound binocular light microscope with Abbe condenser and mechanical stage',
      'Clean microscope glass slides, coverslips, mounted needles, and forceps',
      'Fresh red onion bulb, sterile wooden toothpicks, and dropper pipettes',
      'Methylene blue solution (1%), Iodine solution (KI/I2), and 0.9% physiological saline',
      'Whatman filter paper strips for perfusion staining'
    ],
    safetyPrecautions: [
      'Discard toothpicks in disinfectant jar immediately after epithelial cheek swab',
      'Take care when handling glass slides and coverslips to prevent lacerations'
    ],
    theoreticalBackground:
      'Plant cells feature rigid cellulose cell walls, large central vacuoles, and peripheral nuclei. Animal cells lack cell walls and chloroplasts, possessing a flexible plasma membrane and prominent central nucleus. Differential stains bind to specific biomolecules: Methylene blue is a basic cationic dye that binds negatively charged DNA/RNA in nuclei; iodine reacts with starch and cellulose cell wall polymers.',
    keyFormulas: [
      'Total Magnification: M_total = Magnification(Eyepiece) × Magnification(Objective)',
      'Field of View Diameter: FOV(high) = FOV(low) × [M(low) / M(high)]',
      'Cell Real Size: Real Size = Field Diameter / Number of cells across field'
    ],
    procedureSteps: [
      'Peel a transparent, single-cell-thick inner epidermal layer from an onion bulb scale leaf.',
      'Place tissue flat in a drop of water on glass slide; add 1 drop of iodine stain.',
      'Lower coverslip at a 45° angle with mounted needle to prevent trapping air bubbles.',
      'Place slide on microscope stage; focus first under low power (4x, 10x) using coarse adjustment knob.',
      'Switch to high power (40x); adjust fine focus knob and iris diaphragm for optimum resolution.',
      'Repeat procedure with human cheek buccal epithelial cells stained with methylene blue.',
      'Draw biological sketches of cells and label: Cell wall, Plasma membrane, Nucleus, Cytoplasm.'
    ],
    observationColumns: ['Specimen', 'Objective Lens', 'Total Magnification', 'Cell Shape', 'Organelles Visible', 'Estimated Diameter (μm)'],
    checklistSteps: [
      'Clean eyepiece and objective lenses with lens paper only',
      'Ensure single-layer tissue mount without folds or trapped air bubbles',
      'Always focus upwards away from slide when using high power objective to prevent lens collision',
      'Adjust condenser iris diaphragm to maximize optical contrast',
      'Produce clear biological line drawings with labeled pointer lines ruled horizontally'
    ]
  },
  {
    id: 'bio-2',
    code: 'BIO-PRAC-02',
    discipline: 'bio',
    stream: 'Biological Science',
    subjectName: 'Biology (Biochemistry)',
    title: 'Biochemical Assays for Carbohydrates, Proteins & Lipids',
    duration: '40 mins',
    syllabusUnit: 'Unit 2: Chemical Basis of Life',
    aim: 'Qualitatively detect reducing sugars, non-reducing sugars, starch, proteins, and lipids in biological food extracts using standardized colorimetric assays.',
    learningCompetencies: [
      'Execute Benedict’s test for reducing sugars (glucose, maltose) and acid-hydrolysis for sucrose',
      'Execute Iodine test for amylose starch polysaccharide',
      'Execute Biuret test for peptide bonds (-CONH-) in polypeptide chains',
      'Execute Ethanol emulsion test for hydrophobic lipids and triglycerides'
    ],
    apparatus: [
      'Boiling water bath (80°C - 100°C) with test tube rack and tube holders',
      'Standard Pyrex test tubes, graduated pipettes, and dropper droppers',
      'Benedict’s qualitative reagent (alkaline copper sulfate with sodium citrate)',
      'Iodine reagent, Biuret reagent (NaOH + 1% CuSO4), and Absolute Ethanol (99%)',
      'Food sample extracts: 1% Glucose, 1% Starch, Egg Albumin, Vegetable Oil, Unknown X'
    ],
    safetyPrecautions: [
      'Wear safety spectacles; boiling liquids in test tubes can erupt (point tube opening away from people)',
      'Ethanol is highly flammable; extinguish open flames and use electric water bath'
    ],
    theoreticalBackground:
      'Reducing sugars possess free aldehyde or ketone groups that reduce blue Cu²⁺ ions in Benedict’s reagent to green, yellow, orange, or brick-red Cu₂O precipitate upon boiling. Starch coils into a helix trapping I₃⁻ ions to form a blue-black charge transfer complex. Biuret reagent reacts with peptide bonds under alkaline conditions to form a violet coordination complex with Cu²⁺. Lipids dissolve in ethanol but precipitate as a cloudy white emulsion when added to water.',
    keyFormulas: [
      'Benedict Reduction: R-CHO + 2Cu²⁺ + 5OH⁻ ⟶ R-COO⁻ + Cu₂O (s, brick red) + 3H₂O',
      'Starch Complex: Amylose helix + Polyiodide (I₅⁻) ⟶ Intense Blue-Black Color',
      'Biuret Complex: Peptide bonds + Cu²⁺ (alkaline) ⟶ Violet Chelate Complex'
    ],
    procedureSteps: [
      'Reducing Sugar: Add 2 ml Benedict’s reagent to 2 ml glucose solution; boil in water bath for 3 mins. Note color transition: Blue ⟶ Green ⟶ Yellow ⟶ Brick Red.',
      'Starch: Add 2 drops of iodine solution to 2 ml starch suspension; observe immediate blue-black coloration.',
      'Protein: Add 1 ml 10% NaOH followed by 3 drops of 1% CuSO4 to 2 ml egg albumin solution; observe purple/violet color.',
      'Lipid: Shake 2 ml oil with 2 ml ethanol; pour clear top layer into test tube containing cold water; observe milky white emulsion.',
      'Test unknown sample X through the battery of tests and identify composition.'
    ],
    observationColumns: ['Food Extract', 'Assay Performed', 'Reagent Added', 'Heating Required?', 'Initial Color', 'Final Color / Precipitate', 'Biomolecule Inferred'],
    checklistSteps: [
      'Verify water bath temperature is boiling (>90°C) before inserting Benedict’s tubes',
      'Never boil test tubes directly over bunsen burner without water bath to prevent flash boiling',
      'Add Biuret copper sulfate dropwise; excess CuSO4 masks violet color with dark blue',
      'Ensure ethanol emulsion test tube is free of water before initial lipid dissolution',
      'Record observations in tabular format and formulate chemical inferences'
    ]
  },
  {
    id: 'bio-3',
    code: 'BIO-PRAC-03',
    discipline: 'bio',
    stream: 'Biological Science',
    subjectName: 'Biology (Enzymology)',
    title: 'Enzyme Kinetics & Catalase Decomposition Activity',
    duration: '50 mins',
    syllabusUnit: 'Unit 2: Enzymes & Metabolic Kinetics',
    aim: 'Investigate the quantitative decomposition of hydrogen peroxide by potato catalase (2H₂O₂ ⟶ 2H₂O + O₂) under variable temperature (0°C - 80°C) and pH conditions.',
    learningCompetencies: [
      'Quantify enzyme activity by measuring initial rate of gas product liberation (ml O2 / min)',
      'Determine optimum temperature (T_opt ≈ 37°C) and thermal denaturation at high temperatures (>60°C)',
      'Determine optimum pH (pH ≈ 7.0) and acid/base active site protonation inhibition',
      'Construct rate vs temperature and rate vs pH kinetic response curves'
    ],
    apparatus: [
      'Graduated gas collection syringe (50 ml, low friction plunger) or inverted burette over water',
      'Constant-temperature water baths (0°C, 20°C, 37°C, 50°C, 70°C)',
      'Reaction conical flask with airtight rubber stopper and delivery tube',
      'Standardized 3% (v/v) hydrogen peroxide (H2O2) solution',
      'Fresh potato tuber cork borer cylinders (uniform 5 mm diameter) and razor blade'
    ],
    safetyPrecautions: [
      '3% H2O2 is an oxidizing agent; avoid skin contact and wear protective nitrile gloves',
      'Handle sharp razor blades with care when cutting potato discs'
    ],
    theoreticalBackground:
      'Catalase is a heme-containing tetrameric enzyme that decomposes toxic metabolic hydrogen peroxide: 2H₂O₂ ⟶ 2H₂O + O₂ (g). As temperature increases, kinetic energy increases collision frequency between active sites and substrate molecules (Q10 ≈ 2). Beyond optimum temperature, thermal vibrations disrupt non-covalent bonds (hydrogen, ionic, hydrophobic), causing active site denaturation and irreversible loss of catalytic function.',
    keyFormulas: [
      'Enzymatic Reaction: 2 H₂O₂ (aq) —[Catalase]—⟶ 2 H₂O (l) + O₂ (g)',
      'Initial Reaction Rate: Rate = (Volume of O₂ liberated in ml) / (Time in minutes)',
      'Temperature Coefficient: Q₁₀ = (Rate at T + 10°C) / (Rate at T)'
    ],
    procedureSteps: [
      'Cut 10 uniform 1 mm thick potato discs using a cork borer and razor blade.',
      'Equilibrate 10 ml of 3% H2O2 in a reaction flask in water bath at 37°C for 5 minutes.',
      'Add potato discs to flask, insert stopper connected to gas syringe immediately, and start stopwatch.',
      'Record volume of oxygen gas liberated every 30 seconds for 3 minutes.',
      'Repeat experiment at 0°C (ice bath), 20°C (room temp), 50°C, and 70°C.',
      'Repeat at 37°C using buffer solutions of pH 4.0, pH 7.0, and pH 10.0.',
      'Plot volume vs time curves to determine initial rates; plot rate vs temperature.'
    ],
    observationColumns: ['Temperature (°C)', 'pH', 'O2 Vol at 1 min (ml)', 'O2 Vol at 2 min (ml)', 'Initial Rate (ml/min)', 'Enzyme Conformation'],
    checklistSteps: [
      'Ensure airtight seal between reaction flask and gas syringe',
      'Cut uniform potato discs to ensure identical catalase surface area across trials',
      'Pre-equilibrate substrate at target temperature before adding potato tissue',
      'Start stopwatch at the exact instant potato discs contact peroxide solution',
      'Plot rate vs temperature bell-shaped curve and identify optimum temperature'
    ]
  }
];
