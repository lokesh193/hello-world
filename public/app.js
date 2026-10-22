(() => {
  "use strict";
  const API = "/api/mcp";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const TOPICS = ["DSP architecture","FIR filters","Q15 number format","MAC unit"];
  const TOOL_META = {
    search_study_material:{glyph:"⌕",label:"Search study material"},
    explain_concept:{glyph:"✧",label:"Explain a concept"},
    describe_diagram:{glyph:"▧",label:"Describe a diagram"},
    start_quiz:{glyph:"?",label:"Start a quiz"},
    check_quiz_answer:{glyph:"✓",label:"Check quiz answer"},
    save_progress:{glyph:"◷",label:"Save progress"},
    get_progress:{glyph:"↻",label:"Get saved progress"},
    run_guided_study_cycle:{glyph:"⇄",label:"Guided study cycle"}
  };
  const state = {
    reqId:1, initialized:false, initialising:null, toolNames:[], trace:[],
    voiceOn:true, recognition:null, activeQuiz:null, currentView:"study",
    actions:0, correct:0, mastery:0, topics:new Set(), currentTopic:"DSP architecture",
    notesTitle:"My ECE notes", notes:"", lastSection:"", lastTopic:"",
    learnerKey:"", mcpReady:false, saving:false
  };
  function safeJSONParse(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function randomKey() {
    try { return "ss_" + crypto.randomUUID(); }
    catch { return "ss_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2); }
  }
  function loadLocal() {
    try {
      state.learnerKey = localStorage.getItem("studysaathi_learner_key") || randomKey();
      localStorage.setItem("studysaathi_learner_key", state.learnerKey);
      const saved = safeJSONParse(localStorage.getItem("studysaathi_local_state") || "{}", {});
      state.currentTopic = saved.currentTopic || TOPICS[0];
      state.mastery = Number(saved.mastery)||0;
      state.actions = Number(saved.actions)||0;
      state.correct = Number(saved.correct)||0;
      state.topics = new Set(Array.isArray(saved.topics)?saved.topics:[]);
      state.lastSection = saved.lastSection || "";
      state.lastTopic = saved.lastTopic || "";
      state.notesTitle = saved.notesTitle || "My ECE notes";
      state.notes = saved.notes || "";
    } catch { state.learnerKey = randomKey(); }
    $("#topicSelect").value = state.currentTopic;
    $("#notesTitle").value = state.notesTitle;
    $("#notesContent").value = state.notes;
    renderMetrics();
    renderLocalProgress();
  }
  function saveLocal() {
    try { localStorage.setItem("studysaathi_local_state", JSON.stringify({
      currentTopic:state.currentTopic,mastery:state.mastery,actions:state.actions,correct:state.correct,
      topics:[...state.topics],lastSection:state.lastSection,lastTopic:state.lastTopic,notesTitle:state.notesTitle,notes:state.notes
    })); } catch {}
    renderMetrics();
  }
  function setTrace(message) {
    $("#toolTraceText").textContent = message;
  }
  function trace(name, args, result, error) {
    const item = {at:new Date().toISOString(),name,args,result,error:error?String(error):""};
    state.trace.unshift(item);
    state.trace = state.trace.slice(0,35);
    renderTrace();
    state.actions += 1;
    saveLocal();
    setTrace(error ? "Tool call failed" : "Last tool: " + name);
    $("#metricActions").textContent = String(state.actions);
  }
  function renderTrace() {
    const box = $("#rawToolLog");
    if (!state.trace.length) {
      box.innerHTML = '<p class="muted-text">Tool requests appear here as you use the study companion.</p>';
      return;
    }
    box.innerHTML = state.trace.map(item => '<div class="raw-entry"><strong>'+escapeHTML(item.name)+(item.error?' · ERROR':' · OK')+'</strong><time>'+escapeHTML(new Date(item.at).toLocaleTimeString())+'</time><pre>'+escapeHTML(JSON.stringify({arguments:item.args,result:item.result,error:item.error||undefined},null,2))+'</pre></div>').join("");
  }
  async function postRpc(message, extraHeaders={}) {
    const response = await fetch(API, {
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json, text/event-stream","MCP-Protocol-Version":"2025-11-25",...extraHeaders},
      body:JSON.stringify(message)
    });
    if (!response.ok) throw new Error("MCP server returned HTTP " + response.status + ".");
    const type = (response.headers.get("content-type")||"").toLowerCase();
    if (response.status === 202 || !response.headers.get("content-type")) return null;
    if (type.includes("text/event-stream")) {
      const text = await response.text();
      const data = text.split("\n").filter(line=>line.startsWith("data:")).map(line=>line.slice(5).trim()).join("\n");
      return data ? JSON.parse(data) : null;
    }
    return await response.json();
  }
  async function ensureMcp() {
    if (state.initialized && state.mcpReady) return;
    if (state.initialising) return state.initialising;
    state.initialising = (async () => {
      const init = await postRpc({jsonrpc:"2.0",id:state.reqId++,method:"initialize",params:{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"studysaathi-web-client",version:"1.0.0"}}});
      if (init?.error) throw new Error(init.error.message || "MCP initialisation failed.");
      const version = init?.result?.protocolVersion;
      if (!version) throw new Error("The MCP server did not return a negotiated protocol version.");
      await postRpc({jsonrpc:"2.0",method:"notifications/initialized",params:{}});
      const list = await postRpc({jsonrpc:"2.0",id:state.reqId++,method:"tools/list",params:{}});
      if (list?.error) throw new Error(list.error.message || "Could not list MCP tools.");
      state.toolNames = (list?.result?.tools || []).map(t=>t.name);
      state.initialized = true;
      state.mcpReady = true;
      $("#serverStatusText").textContent = "MCP tools connected";
      $("#toolsServerState").textContent = "MCP endpoint is responding";
      $("#toolsServerInfo").textContent = "Negotiated protocol " + version + " · " + state.toolNames.length + " available tools · Streamable HTTP JSON response.";
      renderToolCards(list.result.tools || []);
      setTrace("MCP connected · " + state.toolNames.length + " tools discovered");
      return list.result.tools || [];
    })();
    try { return await state.initialising; }
    catch (e) {
      state.initialized = false; state.mcpReady = false;
      $("#serverStatusText").textContent = "Study tools unavailable";
      $("#toolsServerState").textContent = "Unable to connect to MCP server";
      $("#toolsServerInfo").textContent = e.message || String(e);
      throw e;
    } finally { state.initialising = null; }
  }
  async function callTool(name, args={}) {
    await ensureMcp();
    try {
      const reply = await postRpc({jsonrpc:"2.0",id:state.reqId++,method:"tools/call",params:{name,arguments:args}});
      if (reply?.error) throw new Error(reply.error.message || "MCP call failed.");
      const result = reply?.result;
      if (!result) throw new Error("MCP tool returned an empty response.");
      if (result.isError) {
        const err = (result.content||[]).map(c=>c.text||"").join("\n");
        throw new Error(err||"The MCP tool reported an error.");
      }
      let data = result.structuredContent;
      if (!data) {
        const t = (result.content||[]).find(c=>c.type==="text")?.text || "";
        data = safeJSONParse(t,{text:t});
      }
      trace(name,args,data,null);
      return data;
    } catch (e) {
      trace(name,args,null,e.message);
      throw e;
    }
  }
  function renderToolCards(tools) {
    const box = $("#toolsList");
    const icons = {search_study_material:"⌕",explain_concept:"✧",describe_diagram:"▧",start_quiz:"?",check_quiz_answer:"✓",save_progress:"◷",get_progress:"↻",run_guided_study_cycle:"⇄"};
    box.innerHTML = tools.map(tool=>'<article class="tool-card"><div class="tool-card-head"><span class="tool-glyph">'+escapeHTML(icons[tool.name]||"◇")+'</span><h3>'+escapeHTML(tool.name)+'</h3></div><p>'+escapeHTML(tool.description)+'</p><code>tools/call · '+escapeHTML(tool.name)+'</code><button type="button" class="tool-run" data-tool="'+escapeHTML(tool.name)+'">Run sample call</button></article>').join("");
    $$(".tool-run",box).forEach(btn=>btn.addEventListener("click",async()=>{
      const name=btn.dataset.tool;
      const args={
        search_study_material:{query:"MAC unit"},
        explain_concept:{topic:state.currentTopic,level:"simple"},
        describe_diagram:{topic:"DSP architecture"},
        start_quiz:{topic:state.currentTopic,question_index:0},
        check_quiz_answer:{topic:"DSP architecture",question_index:0,answer_index:0},
        save_progress:{learner_key:state.learnerKey,topic:state.currentTopic,section:"Sample tool call",mastery:state.mastery,actions_count:state.actions+1,correct_answers:state.correct,topics_explored:[...state.topics]},
        get_progress:{learner_key:state.learnerKey},
        run_guided_study_cycle:{topic:state.currentTopic,level:"simple",question_index:0}
      }[name];
      btn.disabled=true; btn.textContent="Calling MCP…";
      try { const result=await callTool(name,args); addAssistant("MCP tool result for "+name, JSON.stringify(result,null,2)); }
      catch(e) { addAssistant("Connection issue", e.message); }
      finally { btn.disabled=false;btn.textContent="Run sample call"; }
    }));
  }
  function renderMetrics() {
    $("#metricActions").textContent=String(state.actions);
    $("#metricCorrect").textContent=String(state.correct);
    $("#metricTopics").textContent=String(state.topics.size);
    const pct = Math.max(0,Math.min(100,state.mastery));
    $("#topicProgressFill").style.width=pct+"%";
    $("#topicProgressBar").setAttribute("aria-valuenow",String(pct));
    $("#progressPercent").textContent=pct+"% mastery estimate";
    $("#progressText").textContent=pct ? "Keep building your confidence" : "Ready when you are";
    $("#topicSection").textContent=state.topics.size ? state.topics.size+" topic(s) explored" : "4 short learning actions";
    $("#lastSavedText").textContent=state.lastTopic ? state.lastTopic+(state.lastSection ? " · "+state.lastSection : "") : "No session yet";
  }
  async function persistProgress(section) {
    state.lastTopic=state.currentTopic;
    state.lastSection=section||state.lastSection||"Study session";
    state.topics.add(state.currentTopic);
    saveLocal();
    try {
      const result=await callTool("save_progress",{
        learner_key:state.learnerKey,topic:state.currentTopic,section:state.lastSection,
        mastery:state.mastery,actions_count:state.actions+1,correct_answers:state.correct,topics_explored:[...state.topics]
      });
      state.saving=false;
      $("#lastSavedText").textContent=state.lastTopic+" · just saved";
      return result;
    } catch(e) {
      $("#lastSavedText").textContent=state.lastTopic+" · saved in this browser";
      throw e;
    }
  }
  function addUser(text) {
    const article=document.createElement("article");
    article.className="message user-message";
    article.innerHTML='<div class="message-avatar" aria-hidden="true">You</div><div class="message-body"><div class="message-meta"><strong>You</strong><span>STUDY REQUEST</span></div><p></p></div>';
    $("p",article).textContent=text;
    $("#chatLog").append(article);
    article.scrollIntoView({block:"nearest",behavior:"smooth"});
  }
  function addAssistant(title, text, extras={}) {
    const article=document.createElement("article");
    article.className="message assistant-message";
    const content=document.createElement("div");
    content.className="message-body";
    const meta=document.createElement("div");
    meta.className="message-meta";
    meta.innerHTML='<strong>StudySaathi</strong><span>'+escapeHTML(title||"STUDY GUIDE")+'</span>';
    content.append(meta);
    const p=document.createElement("p");
    p.textContent=String(text||"");
    content.append(p);
    if (extras.options) {
      const options=document.createElement("div");
      options.className="quiz-options";
      extras.options.forEach((option,index)=>{
        const btn=document.createElement("button");
        btn.className="quiz-option";
        btn.type="button";
        btn.dataset.letter=String.fromCharCode(65+index);
        btn.textContent=option;
        btn.addEventListener("click",()=>answerQuiz(index,btn));
        options.append(btn);
      });
      content.append(options);
    }
    if (extras.listenText) {
      const btn=document.createElement("button");
      btn.type="button";btn.className="speak-inline";btn.textContent="▶ Listen to answer";
      btn.setAttribute("aria-label","Speak this study answer");
      btn.dataset.speak=extras.listenText;
      btn.addEventListener("click",()=>speak(extras.listenText));
      content.append(btn);
    }
    article.innerHTML='<div class="message-avatar" aria-hidden="true">S<span>✦</span></div>';
    article.append(content);
    $("#chatLog").append(article);
    article.scrollIntoView({block:"nearest",behavior:"smooth"});
    if(state.voiceOn && extras.speak!==false && (extras.listenText||text)) speak(extras.listenText||text);
    return article;
  }
  function topicFromPrompt(prompt) {
    const low=prompt.toLowerCase();
    const match=TOPICS.find(t=>low.includes(t.toLowerCase()));
    if(match) return match;
    if(/mac|multiply.accumulate|accumulator/.test(low)) return "MAC unit";
    if(/fir|filter|tap|coefficient|convolution/.test(low)) return "FIR filters";
    if(/q15|q 15|fixed.point/.test(low)) return "Q15 number format";
    if(/harvard|architecture|processor|program counter|dsp block/.test(low)) return "DSP architecture";
    return state.currentTopic;
  }
  function looksLikeCycle(text) { return /\b(guided study|study cycle|teach me then quiz|explain then quiz|full study session)\b/i.test(text); }
  function looksLikeQuiz(text) { return /\b(quiz|test me|ask me a question|practice question|revise with questions)\b/i.test(text); }
  function looksLikeDiagram(text) { return /\b(diagram|block diagram|flow diagram|describe the figure|describe figure|describe the schematic)\b/i.test(text); }
  function looksLikeContinue(text) { return /\b(continue|resume|where i left|last session|pick up)\b/i.test(text); }
  function looksLikeSearch(text) { return /\b(search|find in my notes|look up|search my material)\b/i.test(text); }
  async function handlePrompt(prompt) {
    state.currentTopic=topicFromPrompt(prompt);
    $("#topicSelect").value=state.currentTopic;
    state.topics.add(state.currentTopic);
    setTrace("Working on "+state.currentTopic+"…");
    if(looksLikeContinue(prompt)) {
      try {
        const result=await callTool("get_progress",{learner_key:state.learnerKey});
        if(result.found && result.progress) {
          const pg=result.progress;
          state.currentTopic=pg.last_topic||state.currentTopic;$("#topicSelect").value=state.currentTopic;
          state.mastery=Number(pg.mastery)||0;state.correct=Number(pg.correct_answers)||state.correct;
          state.actions=Math.max(state.actions,Number(pg.actions_count)||0);
          state.topics=new Set(Array.isArray(pg.topics_explored)?pg.topics_explored:[state.currentTopic]);
          state.lastTopic=pg.last_topic||"";state.lastSection=pg.last_section||"";
          saveLocal();
          addAssistant("SAVED PROGRESS","I found your saved session. Your last topic was "+state.currentTopic+". Your current mastery estimate is "+state.mastery+" percent. We can continue with an explanation or a short revision question.");
          return;
        }
        addAssistant("NEW STUDY SESSION","I couldn't find a saved server-side session for this browser yet. Let's start with "+state.currentTopic+".");
        await explain(prompt);return;
      } catch(e) { addAssistant("PROGRESS LOOKUP", "I couldn't retrieve saved progress from the study server. We can still continue using this browser's saved state. "+e.message,{speak:false});await explain(prompt);return; }
    }
    if(looksLikeCycle(prompt)) { await runGuidedCycle();return; }
    if(looksLikeQuiz(prompt)) { await startQuiz();return; }
    if(looksLikeDiagram(prompt)) { await describeDiagram(prompt);return; }
    if(looksLikeSearch(prompt)) { await searchMaterial(prompt);return; }
    await explain(prompt);
  }
  async function runGuidedCycle() {
    try {
      const noteContext = state.notes.trim() ? state.notes.slice(0,12000) : undefined;
      const searchArgs = {query:state.currentTopic};
      if (noteContext) searchArgs.student_notes = noteContext;
      const search = await callTool("search_study_material", searchArgs);

      const explainArgs = {topic:state.currentTopic,level:"simple"};
      if (noteContext) explainArgs.student_notes = noteContext;
      const explanation = await callTool("explain_concept", explainArgs);

      const quiz = await callTool("start_quiz",{topic:state.currentTopic,question_index:0});
      state.activeQuiz = {topic:quiz.topic||state.currentTopic,question_index:quiz.question_index||0};
      const matches = Array.isArray(search.matches) ? search.matches : [];
      const matchLine = matches.length
        ? matches.map(m=>m.title+" ("+m.section+")").join(", ")
        : "No close built-in match; using the selected topic's reference template.";
      const noteLine = noteContext
        ? "\nYour notes were passed with this request, but this prototype shows a separate excerpt rather than claiming a generated synthesis of arbitrary notes."
        : "";
      const answer = [
        "STEP 1 · SEARCH",
        "Searched the built-in ECE study pack. Match: "+matchLine+".",
        "Source: "+(search.source||"built-in reference pack")+".",
        "STEP 2 · EXPLAIN",
        explanation.explanation||"No explanation was returned.",
        noteLine,
        "STEP 3 · PRACTISE",
        quiz.question||"Question unavailable.",
        ...(quiz.options||[]).map((option,index)=>String.fromCharCode(65+index)+". "+option),
        "Choose an option below. Your answer will be checked, then your progress will be saved."
      ].filter(Boolean).join("\n\n");
      addAssistant("GUIDED STUDY CYCLE",answer,{options:quiz.options||[],speak:false});
      if(state.voiceOn) speak("Guided study cycle for "+state.currentTopic+". Step one, search the built-in study pack. "+(search.matches?.[0]?.excerpt||"No close match was found.")+" Step two, explanation. "+(explanation.explanation||"No explanation returned.")+" Step three, answer this quiz question: "+(quiz.question||"")+" "+(quiz.options||[]).map((o,i)=>String.fromCharCode(65+i)+". "+o).join(". "));
      await persistProgress("Guided study cycle");
    } catch(e) {
      addAssistant("GUIDED STUDY CYCLE ERROR","The multi-step cycle stopped before completion: "+e.message+". You can retry or run an individual study action.",{speak:false});
    }
  }
  async function explain(prompt) {
    const level=/\b(exam|10 marks|10-mark|long answer)\b/i.test(prompt)?"exam":/\b(detailed|in depth|deeply)\b/i.test(prompt)?"detailed":"simple";
    const args={topic:state.currentTopic,level};
    if(state.notes.trim()) args.student_notes=state.notes.slice(0,12000);
    try {
      const result=await callTool("explain_concept",args);
      let answer=result.explanation||"The study tool returned a result, but no explanation field was present.";
      if(result.student_notes_excerpt) answer += "\n\nYour supplied notes were included with this request. Excerpt: "+result.student_notes_excerpt;
      addAssistant("CONCEPT EXPLAINED",answer,{listenText:answer});
      await persistProgress("Explained concept");
    } catch(e) { addAssistant("STUDY TOOL ERROR",e.message+" You can retry the request or choose a quick action.",{speak:false}); }
  }
  async function describeDiagram(prompt) {
    const args={topic:state.currentTopic};
    if(state.notes.trim() && /diagram|block|arrow|connect|input|output/i.test(state.notes)) args.diagram_description=state.notes.slice(0,5000);
    try {
      const result=await callTool("describe_diagram",args);
      const answer=(result.description||"No description was returned.")+"\n\nSource: "+(result.source||"MCP tool")+". "+(result.image_ocr_used===false?"No image OCR was performed.": "");
      addAssistant("DIAGRAM DESCRIPTION",answer,{listenText:answer});
      await persistProgress("Diagram description");
    } catch(e) { addAssistant("DIAGRAM TOOL ERROR",e.message,{speak:false}); }
  }
  async function searchMaterial(prompt) {
    const query=prompt.replace(/search|find in my notes|look up|search my material/ig,"").trim()||state.currentTopic;
    const args={query};
    if(state.notes.trim()) args.student_notes=state.notes.slice(0,12000);
    try {
      const result=await callTool("search_study_material",args);
      const matches=result.matches||[];
      const answer=matches.length?matches.map((m,i)=>(i+1)+". "+m.title+" — "+m.section+"\n"+m.excerpt).join("\n\n"):"I did not find a close match in the built-in ECE study pack. Try another phrase or paste the relevant notes.";
      addAssistant("SEARCH RESULTS",answer,{listenText:answer});
      await persistProgress("Searched material");
    } catch(e) { addAssistant("SEARCH ERROR",e.message,{speak:false}); }
  }
  async function startQuiz() {
    try {
      const q=await callTool("start_quiz",{topic:state.currentTopic,question_index:0});
      state.activeQuiz={topic:q.topic||state.currentTopic,question_index:q.question_index||0};
      addAssistant("PRACTICE QUESTION",q.question||"Question unavailable.",{options:q.options||[],speak:false});
      speak("Practice question. "+q.question+". "+(q.options||[]).map((o,i)=>String.fromCharCode(65+i)+". "+o).join(". "));
    } catch(e) { addAssistant("QUIZ ERROR",e.message,{speak:false}); }
  }
  async function answerQuiz(index,button) {
    const q=state.activeQuiz;
    if(!q) { addAssistant("QUIZ", "Start a new quiz question to practise.");return; }
    $$(".quiz-option").forEach(b=>b.disabled=true);
    try {
      const result=await callTool("check_quiz_answer",{topic:q.topic,question_index:q.question_index,answer_index:index});
      if(result.correct) {state.correct+=1;state.mastery=Math.min(100,state.mastery+Number(result.mastery_increment||10));}
      else { state.mastery=Math.max(0,state.mastery-2); }
      const answer=(result.feedback||"Answer checked.")+"\n\nYour mastery estimate is now "+state.mastery+" percent.";
      addAssistant(result.correct?"CORRECT ANSWER":"REVIEW THIS ONE",answer,{listenText:answer});
      await persistProgress("Quiz on "+q.topic);
      state.activeQuiz=null;
    } catch(e) { $$(".quiz-option").forEach(b=>b.disabled=false);addAssistant("QUIZ ERROR",e.message,{speak:false}); }
  }
  function renderLocalProgress() {
    renderMetrics();
    const box=$("#savedProgressContent");
    if(!state.lastTopic) {
      box.innerHTML='<div class="empty-state"><span>◷</span><strong>Nothing saved yet</strong><p>Explain a concept, finish a quiz, or save a learning point to create your first progress record.</p></div>';
      return;
    }
    box.innerHTML='<article class="saved-topic-card"><p class="eyebrow">LATEST STUDY SESSION</p><h3>'+escapeHTML(state.lastTopic)+'</h3><p>'+escapeHTML(state.lastSection||"Study session")+' · Stored in this browser; syncing to MCP when available.</p><div class="saved-topic-metrics"><div><span>'+state.mastery+'%</span><small>Mastery estimate</small></div><div><span>'+state.correct+'</span><small>Correct answers</small></div><div><span>'+state.actions+'</span><small>Tool actions</small></div></div></article><p class="muted-text">Topics explored: '+escapeHTML([...state.topics].join(", ")||"None yet")+'</p>';
  }
  async function refreshProgress() {
    try {
      const result=await callTool("get_progress",{learner_key:state.learnerKey});
      if(result.found && result.progress) {
        const pg=result.progress;
        state.lastTopic=pg.last_topic||state.lastTopic;state.currentTopic=pg.last_topic||state.currentTopic;
        state.lastSection=pg.last_section||state.lastSection;state.mastery=Number(pg.mastery)||state.mastery;
        state.actions=Math.max(state.actions,Number(pg.actions_count)||0);state.correct=Number(pg.correct_answers)||state.correct;
        if(Array.isArray(pg.topics_explored)) state.topics=new Set(pg.topics_explored);
        $("#topicSelect").value=state.currentTopic;saveLocal();
        $("#savedProgressContent").innerHTML='<article class="saved-topic-card"><p class="eyebrow">SAVED ON STUDY SERVER</p><h3>'+escapeHTML(state.lastTopic)+'</h3><p>'+escapeHTML(state.lastSection||"Study session")+' · Updated '+escapeHTML(pg.updated_at?new Date(pg.updated_at).toLocaleString():"recently")+'</p><div class="saved-topic-metrics"><div><span>'+state.mastery+'%</span><small>Mastery estimate</small></div><div><span>'+state.correct+'</span><small>Correct answers</small></div><div><span>'+state.actions+'</span><small>Tool actions</small></div></div></article><p class="muted-text">Topics explored: '+escapeHTML([...state.topics].join(", ")||"None yet")+'</p>';
      } else renderLocalProgress();
    } catch(e) {
      renderLocalProgress();
      addAssistant("PROGRESS", "Could not fetch server progress. Showing this browser's local state. "+e.message,{speak:false});
    }
  }
  function speak(text) {
    if(!state.voiceOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(String(text||""));
    utterance.lang="en-IN";utterance.rate=0.94;utterance.pitch=1;
    utterance.onstart=()=>$("#speechStatus").textContent="Speaking answer…";
    utterance.onend=()=>$("#speechStatus").textContent="";
    utterance.onerror=()=>$("#speechStatus").textContent="Speech output is unavailable in this browser. You can still read the answer.";
    window.speechSynthesis.speak(utterance);
  }
  function stopSpeech() {
    if("speechSynthesis" in window) window.speechSynthesis.cancel();
    $("#speechStatus").textContent="Speech stopped.";
  }
  function startRecognition() {
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition) {
      $("#speechStatus").textContent="Voice input is not supported in this browser. Use the text box or try a current version of Chrome.";
      return;
    }
    if(state.recognition) {try{state.recognition.stop();}catch{}}
    const rec=new Recognition();state.recognition=rec;
    rec.lang="en-IN";rec.interimResults=true;rec.continuous=false;
    $("#micBtn").classList.add("listening");$("#micBtn").setAttribute("aria-label","Listening. Activate to stop.");
    $("#speechStatus").textContent="Listening. Speak your study question.";
    let finalText="";
    rec.onresult=e=>{
      let interim="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const txt=e.results[i][0].transcript;
        if(e.results[i].isFinal) finalText+=txt;
        else interim+=txt;
      }
      $("#userPrompt").value=(finalText||interim).trim();
    };
    rec.onerror=e=>{$("#speechStatus").textContent=e.error==="not-allowed"?"Microphone permission was denied. You can type instead.":"Voice input stopped: "+e.error+". You can type instead.";};
    rec.onend=()=>{
      $("#micBtn").classList.remove("listening");$("#micBtn").setAttribute("aria-label","Start voice input");
      if($("#userPrompt").value.trim()) $("#speechStatus").textContent="Voice captured. Review it and press Send question.";
      state.recognition=null;
    };
    try{rec.start();}catch(e){$("#speechStatus").textContent="Could not start the microphone. "+e.message;}
  }
  async function sendPrompt(raw) {
    const prompt=String(raw||"").trim();
    if(!prompt) return;
    $("#userPrompt").value="";
    addUser(prompt);
    const submit=$("#sendBtn");submit.disabled=true;
    $("#chatForm").classList.add("loading");
    try { await handlePrompt(prompt); }
    catch(e) { addAssistant("STUDY ERROR",e.message||"A tool failed. Please try again.",{speak:false}); }
    finally {submit.disabled=false;$("#chatForm").classList.remove("loading");$("#userPrompt").focus();}
  }
  function setView(name) {
    const views=["study","notes","progress","tools"];
    if(!views.includes(name)) return;
    state.currentView=name;
    views.forEach(v=>$("#"+v+"View").classList.toggle("hidden",v!==name));
    $$(".side-link").forEach(btn=>{
      const active=btn.dataset.view===name;
      btn.classList.toggle("active",active);
      if(active) btn.setAttribute("aria-current","page"); else btn.removeAttribute("aria-current");
    });
    $("#breadcrumbCurrent").textContent=({study:"Study session",notes:"My study material",progress:"Learning progress",tools:"MCP tools"})[name];
    if(name==="progress") refreshProgress();
    if(name==="tools") ensureMcp().catch(()=>{});
    window.scrollTo({top:0,behavior:"smooth"});
  }
  $$(".side-link").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));
  $$("[data-view]").filter(btn=>!btn.classList.contains("side-link")).forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));
  $$(".suggestion,[data-command]").forEach(btn=>btn.addEventListener("click",()=>sendPrompt(btn.dataset.command)));
  $("#chatForm").addEventListener("submit",e=>{e.preventDefault();sendPrompt($("#userPrompt").value);});
  $("#userPrompt").addEventListener("keydown",e=>{
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#chatForm").requestSubmit();}
  });
  $("#micBtn").addEventListener("click",()=>{ if(state.recognition){try{state.recognition.stop();}catch{};}else startRecognition();});
  $("#stopSpeechBtn").addEventListener("click",stopSpeech);
  $("#readPageBtn").addEventListener("click",()=>speak("StudySaathi Voice. A voice-first learning companion. Choose a topic, ask for a simple explanation, ask for a diagram description, start a quiz, or continue your last session."));
  $("#speakToggle").addEventListener("click",()=>{
    state.voiceOn=!state.voiceOn;
    $("#speakToggle").setAttribute("aria-pressed",String(state.voiceOn));
    $("#speakToggle").innerHTML='<span aria-hidden="true">◖))</span> Spoken replies <i class="toggle-dot"></i>';
    if(!state.voiceOn)stopSpeech();else $("#speechStatus").textContent="Spoken replies enabled.";
  });
  $$(".speak-inline").forEach(btn=>btn.addEventListener("click",()=>speak(btn.dataset.speak||btn.closest(".message-body")?.innerText||"")));
  $("#clearChatBtn").addEventListener("click",()=>{
    $("#chatLog").innerHTML="";
    state.activeQuiz=null;
    addAssistant("NEW SESSION","New study session started. Your saved learning progress remains available. Ask me to explain a concept, describe a diagram, or quiz you.",{speak:false});
  });
  $("#topicSelect").addEventListener("change",()=>{
    state.currentTopic=$("#topicSelect").value;state.topics.add(state.currentTopic);saveLocal();
    setTrace("Selected topic: "+state.currentTopic);
  });
  $("#resumeBtn").addEventListener("click",()=>sendPrompt("Continue my last study session"));
  $("#continueProgressBtn").addEventListener("click",()=>{setView("study");sendPrompt("Continue my last study session");});
  $("#refreshProgressBtn").addEventListener("click",refreshProgress);
  $("#refreshToolsBtn").addEventListener("click",async()=>{
    state.initialized=false;state.mcpReady=false;
    try{await ensureMcp();}catch(e){addAssistant("MCP STATUS",e.message,{speak:false});}
  });
  $("#showToolDetails").addEventListener("click",()=>setView("tools"));
  $("#clearTraceBtn").addEventListener("click",()=>{state.trace=[];renderTrace();setTrace("Tool trace cleared");});
  $("#highContrastToggle").addEventListener("click",()=>{
    document.body.classList.toggle("high-contrast");
    const enabled=document.body.classList.contains("high-contrast");
    $("#highContrastToggle").setAttribute("aria-pressed",String(enabled));
    $("#speechStatus").textContent=enabled?"High-contrast display enabled.":"Standard display restored.";
  });
  $("#notesFile").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>100000){$("#notesStatus").textContent="Please keep the text file below 100 KB.";return;}
    try{
      const text=await file.text();
      if(text.length>12000){$("#notesStatus").textContent="That file is over 12,000 characters. Paste the section you are studying instead.";return;}
      $("#notesTitle").value=file.name.replace(/\.(txt|md)$/i,"").slice(0,90);
      $("#notesContent").value=text;
      $("#notesStatus").textContent="Loaded "+file.name+". Press Use these notes to save it to this browser.";
    }catch{$("#notesStatus").textContent="Could not read that file. Copy and paste the text instead.";}
  });
  $("#saveNotesBtn").addEventListener("click",()=>{
    state.notes=$("#notesContent").value.slice(0,12000);
    state.notesTitle=$("#notesTitle").value.trim().slice(0,90)||"My ECE notes";
    saveLocal();
    $("#notesStatus").textContent="Notes saved in this browser. They will be included in your next study request but are not stored by the MCP progress tool.";
    setView("study");
    addAssistant("NOTES READY","I've prepared your notes for the next study request. When you ask a question, StudySaathi will pass a limited excerpt along with the selected topic. This prototype also shows the built-in reference explanation so you can compare sources.",{speak:false});
  });
  window.addEventListener("beforeunload",()=>{if(state.recognition){try{state.recognition.stop();}catch{}}if("speechSynthesis"in window)window.speechSynthesis.cancel();});
  loadLocal();
  ensureMcp().then(()=>callTool("get_progress",{learner_key:state.learnerKey})).then(result=>{
    if(result?.found&&result.progress){
      const pg=result.progress;state.lastTopic=pg.last_topic||"";state.lastSection=pg.last_section||"";
      state.mastery=Number(pg.mastery)||state.mastery;state.actions=Math.max(state.actions,Number(pg.actions_count)||0);
      state.correct=Number(pg.correct_answers)||state.correct;
      if(Array.isArray(pg.topics_explored))state.topics=new Set(pg.topics_explored);
      if(state.lastTopic&&TOPICS.includes(state.lastTopic))state.currentTopic=state.lastTopic;
      $("#topicSelect").value=state.currentTopic;saveLocal();
    }else{
      callTool("save_progress",{learner_key:state.learnerKey,topic:state.currentTopic,section:"Ready to study",mastery:state.mastery,actions_count:state.actions,correct_answers:state.correct,topics_explored:[...state.topics]}).catch(()=>{});
    }
    $("#serverStatusText").textContent="MCP tools connected";
  }).catch(err=>{
    $("#serverStatusText").textContent="MCP connection needs attention";
    $("#toolTraceText").textContent="Connection error: "+err.message;
    $("#toolsServerState").textContent="Could not connect";
    $("#toolsServerInfo").textContent=err.message;
  });
})();