export const MATERIALS = [
  { title: "DSP architecture", section: "DSP fundamentals", tags: ["dsp", "architecture", "processor", "harvard", "program counter", "data memory", "instruction memory"], body: "A digital signal processor is designed to perform numerical operations on sampled signals efficiently. A common DSP architecture includes a processing unit, arithmetic or multiply-accumulate capability, registers, data memory, program memory, address-generation logic, and buses. Harvard-style designs separate instruction memory and data memory so an instruction fetch and data access can occur in parallel. The exact blocks depend on the processor; a course diagram may show additional shifters, status registers, circular-buffer address logic, and control units." },
  { title: "FIR filters", section: "Digital filtering", tags: ["fir", "filter", "convolution", "coefficients", "impulse response"], body: "A finite impulse response (FIR) filter computes an output from a finite set of current and previous input samples. In a common direct-form expression, y[n] = sum from k=0 to M of h[k] x[n-k], where h[k] are filter coefficients and x[n-k] are the current and delayed input samples. Each tap multiplies one input sample by a coefficient; the products are added to produce the output. FIR filters are widely used because they can be designed to have exactly linear phase when their coefficients have the required symmetry." },
  { title: "Q15 number format", section: "Fixed-point representation", tags: ["q15", "fixed point", "fraction", "integer", "overflow", "signed"], body: "Q15 is a signed fixed-point convention commonly used to represent fractional values in a 16-bit word. Under the common Q1.15 convention, the stored signed integer is divided by 2^15 to interpret the represented real number. The approximate range is -1.0 through 1.0 minus 2^-15. To encode a value, multiply by 32768 and round or truncate according to the chosen implementation, then check the signed 16-bit range. The naming convention can vary by context, so follow the definition used in your course notes." },
  { title: "MAC unit", section: "DSP arithmetic", tags: ["mac", "multiply accumulate", "multiplier", "accumulator", "fir"], body: "A multiply-accumulate (MAC) unit performs a multiplication and adds its product to an accumulated value. This operation is central to digital filters and many signal-processing algorithms. In a FIR filter, a MAC operation can multiply an input sample by a coefficient and accumulate the product with contributions from other taps. DSP processors often provide a wide accumulator to reduce precision loss during intermediate sums; the exact bit width and saturation behavior depend on the processor." },
  { title: "Circular buffers and address generation", section: "Memory addressing", tags: ["circular buffer", "address generator", "wrap", "buffer", "pointer"], body: "A circular buffer stores a sequence of samples in a fixed-size region of memory. After the pointer reaches the final location, address-generation logic wraps it to the beginning of the region rather than moving into unrelated memory. This lets a DSP keep a moving window of recent samples without shifting every value in memory. Some processors implement circular addressing in hardware, while others use software or library routines." }
];

export const QUIZZES = {
  "DSP architecture": [
    { question: "What is one advantage of a Harvard-style architecture?", options: ["It can separate instruction and data access", "It removes the need for registers", "It makes every operation analog", "It eliminates program memory"], correct: 0, explanation: "Separate instruction and data memories can allow instruction fetch and data access to happen in parallel." },
    { question: "Which component commonly speeds up repeated DSP multiply-and-sum operations?", options: ["Display controller", "MAC unit", "Keyboard buffer", "Network router"], correct: 1, explanation: "A multiply-accumulate unit performs multiplication and adds the product into an accumulator." }
  ],
  "FIR filters": [
    { question: "What does a tap in a direct-form FIR filter commonly contribute?", options: ["A sample times its coefficient", "A network packet", "A clock reset only", "A display pixel"], correct: 0, explanation: "Each tap multiplies an input sample (often delayed) by a coefficient and contributes to the sum." },
    { question: "Which statement is true of a finite impulse response filter?", options: ["Its impulse response has finite duration", "It must contain feedback", "It has no coefficients", "It only processes images"], correct: 0, explanation: "An FIR filter has an impulse response with a finite number of nonzero samples." }
  ],
  "Q15 number format": [
    { question: "In the common Q1.15 convention, how do you interpret the signed stored integer?", options: ["Divide by 2^15", "Multiply by 15", "Divide by 2", "Read as an unsigned decimal only"], correct: 0, explanation: "In common Q1.15 notation, the represented real value is the signed integer divided by 32768." },
    { question: "What is the largest positive value representable in signed Q1.15?", options: ["Exactly 1.0", "1.5", "1.0 minus 2^-15", "32768"], correct: 2, explanation: "The largest signed 16-bit integer is 32767, which corresponds to 32767/32768 = 1 - 2^-15." }
  ],
  "MAC unit": [
    { question: "What does a multiply-accumulate unit do?", options: ["Multiplies values and adds the product to a running sum", "Only compares strings", "Refreshes the display", "Deletes old samples"], correct: 0, explanation: "MAC combines multiplication with accumulation, making repeated sum-of-products operations efficient." }
  ]
};

export function normalizeText(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function topicFor(query) {
  const q = normalizeText(query);
  return MATERIALS.find(m => normalizeText(m.title) === q || normalizeText(m.title).includes(q) || q.includes(normalizeText(m.title)))
    || MATERIALS.find(m => m.tags.some(tag => q.includes(normalizeText(tag))))
    || MATERIALS[0];
}

export function searchMaterials(query) {
  const q = normalizeText(query);
  const tokens = q.split(" ").filter(t => t.length > 2);
  return MATERIALS.map(m => ({
    title: m.title, section: m.section, excerpt: m.body,
    score: [m.title,m.section,...m.tags].reduce((n,s)=>n+(q.includes(normalizeText(s))||normalizeText(s).includes(q)?3:0),0)
      + tokens.reduce((n,t)=>n+([m.title,m.section,...m.tags].some(s=>normalizeText(s).includes(t))?1:0),0)
  })).filter(m=>m.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
}

export function quizFor(topic) {
  const t = topicFor(topic);
  return {topic:t.title, questions:QUIZZES[t.title] || QUIZZES["DSP architecture"]};
}