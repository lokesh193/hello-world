import { db } from "hatchable";

export const access = "public";
export const methods = ["GET", "POST", "DELETE"];

const PROTOCOL = "2025-11-25";
const SERVER = { name: "studysaathi-mcp", version: "1.0.0" };
const MATERIALS = [
  { title: "DSP architecture", section: "DSP fundamentals", tags: ["dsp", "architecture", "processor", "harvard", "program counter", "data memory", "instruction memory"], body: "A digital signal processor is designed to perform numerical operations on sampled signals efficiently. A common DSP architecture includes a processing unit, arithmetic or multiply-accumulate capability, registers, data memory, program memory, address-generation logic, and buses. Harvard-style designs separate instruction memory and data memory so an instruction fetch and data access can occur in parallel. The exact blocks depend on the processor; a course diagram may show additional shifters, status registers, circular-buffer address logic, and control units." },
  { title: "FIR filters", section: "Digital filtering", tags: ["fir", "filter", "convolution", "coefficients", "impulse response"], body: "A finite impulse response (FIR) filter computes an output from a finite set of current and previous input samples. In a common direct-form expression, y[n] = sum from k=0 to M of h[k] x[n-k], where h[k] are filter coefficients and x[n-k] are the current and delayed input samples. Each tap multiplies one input sample by a coefficient; the products are added to produce the output. FIR filters are widely used because they can be designed to have exactly linear phase when their coefficients have the required symmetry." },
  { title: "Q15 number format", section: "Fixed-point representation", tags: ["q15", "fixed point", "fraction", "integer", "overflow", "signed"], body: "Q15 is a signed fixed-point convention commonly used to represent fractional values in a 16-bit word. Under the common Q1.15 convention, the stored signed integer is divided by 2^15 to interpret the represented real number. The approximate range is -1.0 through 1.0 minus 2^-15. To encode a value, multiply by 32768 and round or truncate according to the chosen implementation, then check the signed 16-bit range. The naming convention can vary by context, so follow the definition used in your course notes." },
  { title: "MAC unit", section: "DSP arithmetic", tags: ["mac", "multiply accumulate", "multiplier", "accumulator", "fir"], body: "A multiply-accumulate (MAC) unit performs a multiplication and adds its product to an accumulated value. This operation is central to digital filters and many signal-processing algorithms. In a FIR filter, a MAC operation can multiply an input sample by a coefficient and accumulate the product with contributions from other taps. DSP processors often provide a wide accumulator to reduce precision loss during intermediate sums; the exact bit width and saturation behavior depend on the processor." },
  { title: "Circular buffers and address generation", section: "Memory addressing", tags: ["circular buffer", "address generator", "wrap", "buffer", "pointer"], body: "A circular buffer stores a sequence of samples in a fixed-size region of memory. After the pointer reaches the final location, address-generation logic wraps it to the beginning of the region rather than moving into unrelated memory. This lets a DSP keep a moving window of recent samples without shifting every value in memory. Some processors implement circular addressing in hardware, while others use software or library routines." }
];

const QUIZZES = {
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

const TOOLS = [
  { name: "search_study_material", description: "Search the built-in ECE study pack and optional student-provided text for relevant learning material. Returns source-labelled snippets.", inputSchema: { type: "object", properties: { query: { type: "string", description: "Topic or phrase to search" }, student_notes: { type: "string", description: "Optional notes text supplied for this request" } }, required: ["query"] } },
  { name: "explain_concept", description: "Explain a concept in clear language using the built-in ECE pack and, when provided, the student's own notes as context. States which source was used.", inputSchema: { type: "object", properties: { topic: { type: "string" }, level: { type: "string", enum: ["simple", "exam", "detailed"] }, student_notes: { type: "string" } }, required: ["topic"] } },
  { name: "describe_diagram", description: "Provide a sequential, screen-reader-friendly verbal description of a known DSP/FIR diagram or of a diagram description pasted by the learner. This tool does not perform image OCR.", inputSchema: { type: "object", properties: { topic: { type: "string" }, diagram_description: { type: "string", description: "Optional text describing the diagram's visible blocks and connections" } }, required: ["topic"] } },
  { name: "start_quiz", description: "Return one multiple-choice revision question for a supported ECE topic. Call check_quiz_answer to score a learner response.", inputSchema: { type: "object", properties: { topic: { type: "string" }, question_index: { type: "integer", minimum: 0 } }, required: ["topic"] } },
  { name: "check_quiz_answer", description: "Score one answer against the built-in study-pack quiz, explain why it is right or wrong, and report a mastery increment.", inputSchema: { type: "object", properties: { topic: { type: "string" }, question_index: { type: "integer", minimum: 0 }, answer_index: { type: "integer", minimum: 0 } }, required: ["topic", "question_index", "answer_index"] } },
  { name: "save_progress", description: "Save the learner's last topic, section and mastery with a random browser-generated anonymous key; does not store notes or personal identity.", inputSchema: { type: "object", properties: { learner_key: { type: "string" }, topic: { type: "string" }, section: { type: "string" }, mastery: { type: "integer", minimum: 0, maximum: 100 }, actions_count: { type: "integer", minimum: 0 }, correct_answers: { type: "integer", minimum: 0 }, topics_explored: { type: "array", items: { type: "string" } } }, required: ["learner_key", "topic"] } },
  { name: "get_progress", description: "Retrieve previously saved study progress using the anonymous browser key.", inputSchema: { type: "object", properties: { learner_key: { type: "string" } }, required: ["learner_key"] } },
  { name: "run_guided_study_cycle", description: "Compose a multi-step study workflow: search the ECE study pack, explain the selected topic, and return one quiz question. Identifies the built-in reference source and does not claim image OCR or generative synthesis of arbitrary notes.", inputSchema: { type: "object", properties: { topic: { type: "string" }, level: { type: "string", enum: ["simple", "exam", "detailed"] }, student_notes: { type: "string" }, question_index: { type: "integer", minimum: 0 } }, required: ["topic"] } }
];

function textResult(text, structuredContent) {
  const out = { content: [{ type: "text", text }] };
  if (structuredContent !== undefined) out.structuredContent = structuredContent;
  return out;
}
function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function findMaterial(query) {
  const q = norm(query);
  const tokens = q.split(" ").filter(t => t.length > 2);
  return MATERIALS.map(m => ({ ...m, score: [m.title, m.section, ...m.tags].reduce((n, s) => n + (q.includes(norm(s)) || norm(s).includes(q) ? 3 : 0), 0) + tokens.reduce((n,t) => n + ([m.title,m.section,...m.tags].some(s => norm(s).includes(t)) ? 1 : 0),0) })).sort((a,b)=>b.score-a.score);
}
function topicName(query) {
  const q = norm(query);
  return MATERIALS.find(m => norm(m.title) === q || norm(m.title).includes(q) || q.includes(norm(m.title)))?.title
    || MATERIALS.find(m => m.tags.some(tag => q.includes(norm(tag))))?.title || "DSP architecture";
}
function codeText(tool, args) {
  const topic = topicName(args.topic || args.query);
  const material = MATERIALS.find(m => m.title === topic) || MATERIALS[0];
  if (tool === "run_guided_study_cycle") {
    const matches = findMaterial(args.topic || topic).filter(m => m.score > 0).slice(0,3);
    const questions = QUIZZES[topic] || QUIZZES["DSP architecture"];
    const idx = Math.max(0, Math.min(questions.length-1, Number.isInteger(args.question_index) ? args.question_index : 0));
    const question = questions[idx];
    const level = args.level || "simple";
    const notes = String(args.student_notes || "").trim().slice(0,12000);
    let explanation = material.body;
    if (level === "simple") explanation = "In simple terms: " + material.body;
    if (level === "exam") explanation = "Exam-ready explanation — " + material.body + " Key points to remember: define the concept, explain the data flow, and state one practical use.";
    if (level === "detailed") explanation = material.body + " Study check: explain the definition, flow, key operation, and one implementation limitation.";
    const workflow = {
      workflow: "search_explain_quiz",
      topic: material.title,
      source: notes ? "Built-in ECE study pack; learner notes excerpt returned separately" : "Built-in ECE study pack",
      steps: [
        {step:1,tool:"search_study_material",query:args.topic || topic,matches:matches.map(m=>({title:m.title,section:m.section,excerpt:m.body}))},
        {step:2,tool:"explain_concept",topic:material.title,level,explanation},
        {step:3,tool:"start_quiz",topic:material.title,question_index:idx,question:question.question,options:question.options}
      ],
      student_notes_excerpt: notes ? notes.slice(0,1000) : "",
      notice: "The workflow uses deterministic reference content; learner notes are shown separately and are not treated as a generated synthesis."
    };
    return textResult(JSON.stringify(workflow,null,2),workflow);
  }
  if (tool === "search_study_material") {
    const matches = findMaterial(args.query).filter(m => m.score > 0).slice(0,3);
    const useNotes = String(args.student_notes || "").trim().slice(0,12000);
    return textResult(JSON.stringify({ source: useNotes ? "Student-provided notes plus built-in ECE pack" : "Built-in ECE study pack", query: args.query, matches: matches.map(m=>({title:m.title,section:m.section,excerpt:m.body})), notes_excerpt: useNotes ? useNotes.slice(0,2400) : undefined }, null, 2), {source:useNotes ? "student_notes_and_built_in_pack" : "built_in_ece_pack", matches:matches.map(m=>({title:m.title,section:m.section,excerpt:m.body})), notes_excerpt:useNotes ? useNotes.slice(0,2400) : ""});
  }
  if (tool === "explain_concept") {
    const notes = String(args.student_notes || "").trim().slice(0,12000);
    let explanation = material.body;
    if (args.level === "simple") explanation = "In simple terms: " + material.body;
    if (args.level === "exam") explanation = "Exam-ready explanation — " + material.body + " Key points to remember: identify the definition, explain how the blocks or calculation work, and state one practical use.";
    if (args.level === "detailed") explanation = material.body + " Study check: explain the definition, the signal or data flow, the key operation, and one implementation limitation in your own words.";
    return textResult(JSON.stringify({topic:material.title, section:material.section, level:args.level || "simple", source:notes ? "Student notes supplied with this request; cross-check against the built-in ECE study pack." : "Built-in ECE study pack", explanation, note_excerpt:notes ? notes.slice(0,1000) : ""},null,2), {topic:material.title, section:material.section, level:args.level || "simple", source:notes ? "student_notes_and_built_in_pack" : "built_in_ece_pack", explanation, student_notes_excerpt:notes ? notes.slice(0,1000) : ""});
  }
  if (tool === "describe_diagram") {
    const desc = String(args.diagram_description || "").trim().slice(0,5000);
    let description;
    if (desc) description = "Sequential description based on the text you supplied: " + desc + ". Start at the first stated block, follow each explicitly stated connection in order, then describe the output. If a connection is missing from the text, this tool cannot verify it from an image.";
    else if (topic === "FIR filters") description = "Imagine a row of delay blocks connected in sequence. The input sample enters the first position; each delay provides an older sample. Each sample branches into a multiplier paired with a filter coefficient. The multiplier outputs feed an adder or accumulator, which combines them into y of n. The verbal flow is: input, delays and samples, coefficient multiplications, summation, output. This is a generic FIR direct-form description, not an extraction from an uploaded image.";
    else if (topic === "DSP architecture") description = "Start with the program memory, which supplies instructions to the processor's control path. Input samples and other values travel through data memory into registers and the processing unit. The arithmetic or MAC unit performs the numerical operations, while address-generation logic determines which samples or coefficients are accessed next. The result is written to a register or data memory. A Harvard-style diagram often draws instruction and data memories separately. Exact connections and labels vary by processor, so compare this generic sequence with your own course diagram.";
    else if (topic === "Circular buffers and address generation") description = "Picture a fixed row of memory locations. A pointer advances from one location to the next as samples are stored or read. At the last location, circular-addressing logic wraps the pointer to the first location. The buffer itself does not move; only the address pointer wraps around.";
    else description = "This tool has a generic verbal template for DSP architecture, FIR filters and circular buffers. For " + topic + ", please paste the diagram's visible labels and arrows into the text-description field so it can describe your actual diagram without guessing.";
    return textResult(JSON.stringify({topic,source:desc ? "Student-provided diagram description" : "Built-in verbal template", description, image_ocr_used:false},null,2), {topic, source:desc ? "student_diagram_description" : "built_in_diagram_template", description, image_ocr_used:false});
  }
  if (tool === "start_quiz") {
    const questions = QUIZZES[topic] || QUIZZES["DSP architecture"];
    const idx = Math.max(0, Math.min(questions.length-1, Number.isInteger(args.question_index) ? args.question_index : 0));
    const q = questions[idx];
    return textResult(JSON.stringify({topic,question_index:idx,question:q.question,options:q.options,answer_required:true},null,2), {topic,question_index:idx,question:q.question,options:q.options});
  }
  if (tool === "check_quiz_answer") {
    const questions = QUIZZES[topic] || QUIZZES["DSP architecture"];
    const idx = Math.max(0,Math.min(questions.length-1, Number.isInteger(args.question_index)?args.question_index:0));
    const q = questions[idx], correct = Number(args.answer_index) === q.correct;
    return textResult(JSON.stringify({topic,question_index:idx,correct,correct_index:q.correct,correct_answer:q.options[q.correct],explanation:q.explanation,mastery_increment:correct?10:0,feedback:correct?"Correct. "+q.explanation:"Not quite. The correct answer is: "+q.options[q.correct]+". "+q.explanation},null,2), {topic,question_index:idx,correct,correct_index:q.correct,correct_answer:q.options[q.correct],explanation:q.explanation,mastery_increment:correct?10:0,feedback:correct?"Correct. "+q.explanation:"Not quite. The correct answer is: "+q.options[q.correct]+". "+q.explanation});
  }
  return null;
}

async function executeTool(name,args) {
  if (name === "save_progress") {
    const key = String(args.learner_key || "");
    if (!/^[a-zA-Z0-9_-]{20,100}$/.test(key)) throw new Error("A valid anonymous learner key is required.");
    const topic = String(args.topic || "DSP architecture").slice(0,100);
    const section = String(args.section || "").slice(0,120);
    const mastery = Math.max(0,Math.min(100,Number(args.mastery)||0));
    const actions = Math.max(0,Math.min(10000,Number(args.actions_count)||0));
    const correct = Math.max(0,Math.min(10000,Number(args.correct_answers)||0));
    const topics = Array.isArray(args.topics_explored) ? args.topics_explored.map(x=>String(x).slice(0,100)).slice(0,20) : [];
    const { rows } = await db.query("INSERT INTO study_progress (learner_key, last_topic, last_section, mastery, actions_count, correct_answers, topics_explored, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,NOW()) ON CONFLICT (learner_key) DO UPDATE SET last_topic=EXCLUDED.last_topic,last_section=EXCLUDED.last_section,mastery=EXCLUDED.mastery,actions_count=EXCLUDED.actions_count,correct_answers=EXCLUDED.correct_answers,topics_explored=EXCLUDED.topics_explored,updated_at=NOW() RETURNING last_topic,last_section,mastery,actions_count,correct_answers,topics_explored,updated_at", [key,topic,section,mastery,actions,correct,JSON.stringify(topics)]);
    return textResult(JSON.stringify({saved:true,progress:rows[0],privacy:"The anonymous key, topic and progress counters are stored; student notes are not saved."},null,2), {saved:true,progress:rows[0],privacy:"No student notes are stored."});
  }
  if (name === "get_progress") {
    const key = String(args.learner_key || "");
    if (!/^[a-zA-Z0-9_-]{20,100}$/.test(key)) throw new Error("A valid anonymous learner key is required.");
    const { rows } = await db.query("SELECT last_topic,last_section,mastery,actions_count,correct_answers,topics_explored,updated_at FROM study_progress WHERE learner_key=$1 LIMIT 1", [key]);
    return textResult(JSON.stringify({found:rows.length>0,progress:rows[0]||null},null,2), {found:rows.length>0,progress:rows[0]||null});
  }
  const out = codeText(name,args);
  if (!out) throw new Error("Unknown tool: "+name);
  return out;
}

function jsonRpcError(id, code, message) { return { jsonrpc:"2.0", id:id ?? null, error:{code,message} }; }

export default async function (req,res) {
  const requestOrigin = req.headers?.origin;
  const requestHost = req.headers?.host;
  if (requestOrigin && requestHost) {
    try {
      const parsedOrigin = new URL(requestOrigin);
      if (parsedOrigin.host.toLowerCase() !== String(requestHost).toLowerCase()) {
        return res.status(403).json({error:"Origin is not allowed."});
      }
    } catch {
      return res.status(403).json({error:"Invalid Origin header."});
    }
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, MCP-Protocol-Version, Accept, Authorization");
  res.setHeader("Cache-Control","no-store");
  if (req.method === "GET") {
    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({error:"This Streamable HTTP MCP endpoint uses POST for client requests; server-initiated SSE is not implemented."});
  }
  if (req.method === "DELETE") return res.status(405).json({error:"This stateless MCP server does not create sessions; DELETE is not supported."});
  const protocolHeader = req.headers?.["mcp-protocol-version"];
  if (protocolHeader && protocolHeader !== PROTOCOL) {
    return res.status(400).json({error:"Unsupported MCP-Protocol-Version. Supported version: " + PROTOCOL});
  }
  const body = req.body || {};
  if (Array.isArray(body)) {
    const results = [];
    for (const item of body) results.push(await handleRpc(item,res));
    return res.json(results.filter(Boolean));
  }
  const reply = await handleRpc(body,res);
  if (!reply) return res.status(202).send("");
  res.setHeader("Content-Type","application/json");
  return res.json(reply);
}

async function handleRpc(message,res) {
  const id = Object.prototype.hasOwnProperty.call(message || {}, "id") ? message.id : undefined;
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") return jsonRpcError(id,-32600,"Invalid JSON-RPC request.");
  if (id === undefined && (message.method === "notifications/initialized" || message.method.startsWith("notifications/"))) return null;
  if (message.method === "initialize") {
    if (message.params?.protocolVersion !== PROTOCOL) return jsonRpcError(id,-32602,"Unsupported protocol version. Supported: " + PROTOCOL);
    return {jsonrpc:"2.0",id,result:{protocolVersion:PROTOCOL,capabilities:{tools:{listChanged:false}},serverInfo:SERVER,instructions:"StudySaathi is a voice-first study companion for ECE concepts. Use the built-in ECE study pack; identify whether a response came from built-in material or student-provided text. Diagram description uses a template or supplied text, not image OCR. Student notes are passed in requests and are not stored by save_progress."}};
  }
  if (message.method === "ping") return {jsonrpc:"2.0",id,result:{}};
  if (message.method === "tools/list") return {jsonrpc:"2.0",id,result:{tools:TOOLS}};
  if (message.method === "tools/call") {
    const name = message.params?.name;
    const args = message.params?.arguments || {};
    try {
      const result = await executeTool(name,args);
      return {jsonrpc:"2.0",id,result};
    } catch(e) {
      return {jsonrpc:"2.0",id,result:{isError:true,content:[{type:"text",text:String(e?.message||"Tool failed.")}]}};
    }
  }
  return jsonRpcError(id,-32601,"Method not found: "+message.method);
}