# Hackathon Submission Notes

## Project
**StudySaathi Voice — Accessible Study Companion**

## Primary track
**Alexa+ — simulated experience route.** This submission demonstrates an Alexa+-style experience in a web app and includes the simulation's source code. It does not claim an actual Alexa+ integration or Echo-device connection.

## One-line summary
An accessibility-first, voice-enabled study companion for blind and low-vision college students, with MCP tools for ECE concept explanations, study-pack search, sequential diagram narration, guided quizzes, and anonymous progress tracking.

## Why it matters
Students who rely on spoken interfaces can face friction when study workflows require reading dense material, interpreting block diagrams, or remembering where they left off. StudySaathi combines speech output with simpler explanations, quiz feedback and resumable learning state in one interface.

## Technology details
- Web UI: HTML, CSS, JavaScript
- Voice: browser Speech Synthesis and Speech Recognition where supported
- MCP: JSON-RPC 2.0 over Streamable HTTP; requests negotiate protocol 2025-11-25
- Backend: hosted JavaScript endpoint and native MCP tools
- Persistence: PostgreSQL-backed progress fields
- Open-source license: MIT

## What the judges can inspect
- Live browser demo and visible tool trace
- api/mcp.js for the browser-facing MCP server
- mcp/*.js for native tool definitions and handler implementations
- lib/study.js for the deterministic, hand-authored ECE reference set
- migrations/0001_study_progress.sql for the progress data model
- public/mcp-smoke-test.mjs for protocol and tool smoke tests

## Accuracy and limitation disclosure
The current ECE reference set is deliberately small and hand-authored. Explanations use this reference content and are not generated from an arbitrary set of notes by an LLM. Diagram narration uses generic templates or a text description supplied by the learner; image OCR or visual diagram analysis is not implemented. Voice support varies by browser/OS. Progress mastery is illustrative, not an official grade.

## Product feedback for the hackathon form
**What I used:** A hosted web UI, browser speech APIs, a browser-facing MCP Streamable HTTP endpoint, native MCP tools, and a PostgreSQL table for anonymous learning progress.

**What worked well:** The deployment workflow enabled rapid iteration; the tool calls are inspectable; the database makes study progress persistent; no additional front-end package installation was required.

**What needs improvement:** A production version needs protocol conformance tests, rate limiting and abuse protections for public endpoints, multilingual speech support, visual diagram extraction, better-grounded note retrieval and broader educational evaluation.

**Would I build with the tools again?** Yes for a fast prototype. I would add user-scoped access controls, stronger educational validation and additional automated tests before a production release.

## Mini challenges
Do not claim the AWS Builder mini challenge: this version does not make a documented AWS service integration. Do not claim the Open Source mini challenge solely because the primary project is public; the rules ask for an additional open-source project or contribution alongside the primary submission.
