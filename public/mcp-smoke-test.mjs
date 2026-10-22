// Minimal smoke test for the browser-demo Streamable HTTP MCP endpoint.
// Usage: node mcp-smoke-test.mjs https://YOUR-APP-URL
// No third-party dependencies are required.
const base = String(process.argv[2] || "").replace(/\/$/, "");
if (!/^https?:\/\//i.test(base)) {
  console.error("Usage: node mcp-smoke-test.mjs https://YOUR-APP-URL");
  process.exit(2);
}
let id = 1;
async function rpc(method, params = {}) {
  const response = await fetch(base + "/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-11-25"
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(method + " returned HTTP " + response.status + ": " + text);
  if (response.status === 202 || !text) return null;
  if ((response.headers.get("content-type") || "").includes("text/event-stream")) {
    const data = text.split("\n").filter(s => s.startsWith("data:")).map(s => s.slice(5).trim()).join("\n");
    return data ? JSON.parse(data) : null;
  }
  return JSON.parse(text);
}
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function main() {
  try {
    const init = await rpc("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: {name:"studysaathi-smoke-test",version:"1.0.0"} });
    assert(init?.result?.protocolVersion === "2025-11-25", "Protocol negotiation failed.");
    await rpc("notifications/initialized");
    const listed = await rpc("tools/list");
    const names = (listed?.result?.tools || []).map(t => t.name);
    for (const name of ["explain_concept","describe_diagram","start_quiz","check_quiz_answer","save_progress","get_progress"]) assert(names.includes(name), "Missing tool: " + name);
    const explanation = await rpc("tools/call", {name:"explain_concept",arguments:{topic:"MAC unit",level:"simple"}});
    assert(!explanation?.error && JSON.stringify(explanation).includes("multiply-accumulate"), "Concept explanation failed.");
    const quiz = await rpc("tools/call", {name:"start_quiz",arguments:{topic:"DSP architecture",question_index:0}});
    assert(!quiz?.error && JSON.stringify(quiz).includes("Harvard-style"), "Quiz start failed.");
    const checked = await rpc("tools/call", {name:"check_quiz_answer",arguments:{topic:"DSP architecture",question_index:0,answer_index:0}});
    assert(!checked?.error && JSON.stringify(checked).includes('"correct":true'), "Quiz answer check failed.");
    console.log(JSON.stringify({ok:true,protocol:init.result.protocolVersion,tools:names,tests:["initialize","notifications/initialized","tools/list","explain_concept","start_quiz","check_quiz_answer"]},null,2));
  } catch (error) {
    console.error("MCP smoke test failed:", error.message);
    process.exit(1);
  }
}
main();