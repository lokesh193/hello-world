# 3-Minute Demo Script — StudySaathi Voice

**Track:** Alexa+ (web-based simulated experience)  
**Target length:** 2 minutes 35 seconds  
**Important:** Show the running app and real tool call. Do not imply this is a live Alexa+ device integration.

## 0:00–0:15 — The problem
**Screen:** Open StudySaathi. Keep the welcome heading visible.

**Narration:**  
"Many learning tools are built around reading and navigating dense screens. StudySaathi Voice is a voice-first study companion designed for blind and low-vision college students. It helps them learn through spoken explanations, guided practice, and resumable progress."

## 0:15–0:40 — Guided study cycle
**Action:** Click **Guided study cycle** and wait until all three steps appear: search, explanation, and a quiz question. If speech is supported, let the spoken version of the explanation begin.

**Narration:**  
"One student request starts a small learning workflow. StudySaathi searches its ECE study pack, explains the selected concept, and prepares a short quiz. These are real MCP calls, not a prerecorded chatbot answer."

## 0:40–1:10 — Show that MCP is real
**Action:** Open **MCP tools**. Point out protocol version 2025-11-25, the registered tool list, and the recent tool-call trace.

**Narration:**  
"This is not only a mock chatbot. The web client sends JSON-RPC requests over HTTP to the StudySaathi MCP endpoint. The source includes tool discovery and actual tool calls. The tool catalog includes material search, concept explanation, diagram narration, quiz generation and checking, progress persistence, and a composite guided-study tool."

## 1:10–1:40 — Quiz and feedback
**Action:** Return to **Study session**, choose an option from the quiz already shown by Guided Study Cycle, and show the correctness explanation.

**Narration:**  
"StudySaathi supports a small ECE practice bank. The answer is checked against a deterministic key, and the student receives immediate feedback. This is a transparent baseline, not a claim of a large general-purpose AI model."

## 1:40–2:05 — Resume learning
**Action:** Visit **Learning progress**, refresh progress, then return to study.

**Narration:**  
"The app can save the last topic and a simple mastery estimate under a random anonymous browser key. The database stores progress fields, not the full study notes or a student identity."

## 2:05–2:25 — Accessibility and limitations
**Action:** Show the high-contrast toggle. Optionally show the notes panel.

**Narration:**  
"The interface includes keyboard focus states, a skip link, screen-reader-friendly status regions, and spoken output when supported. The current diagram feature narrates templates or a text description; it does not yet perform visual OCR on uploaded images."

## 2:25–2:35 — Close
**Narration:**  
"StudySaathi Voice combines accessibility-first interaction with inspectable MCP tools. The next step is to validate it with visually impaired learners and extend its grounded study-material coverage."

## Before recording
- Set the deployed project visibility to **Public** so judges can access the permanent URL.
- Open the app in a clean browser window and verify the MCP status reads **MCP tools connected**.
- Test microphone and spoken output on the same device before recording; if permission or browser support fails, use text input and click **Listen to answer** where available.
- Do not show private account data. Use only the demo learner profile.
- Keep the final video in English and under 3 minutes.
