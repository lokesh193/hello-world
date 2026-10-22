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


## What was built during the submission window
During this hackathon build, the project was implemented and deployed as a working web-based simulated Alexa+ experience. The work includes the accessible study interface, a browser-facing Streamable HTTP MCP endpoint, native MCP tool definitions, ECE study-reference data, quiz scoring, anonymous learning-progress persistence, source and run documentation, and a timed demo plan. It does not claim an existing Alexa+ integration or unsupported vision capability.

## Tool-by-tool product feedback

### Hatchable hosting and deployment
- **Used for:** Hosting the web app and server endpoint, deploying the project, and managing the database migration.
- **Worked well:** Rapid deploy/iterate workflow, a public URL, integrated API routes, and persistent PostgreSQL storage.
- **Needs work:** An explicit static-entrypoint check would make deployment verification easier; the root page was caught by a separate browser smoke test rather than the first deployment validation.
- **Onboarding:** Once the project/file workflow was understood, the path from source files to a live demo was short. The distinction between a deploy validation pass and a browser-level root-page check is worth documenting clearly.
- **Use again?** Yes for prototypes; add independent endpoint and UI smoke tests for a time-critical release.

### MCP JSON-RPC / Streamable HTTP
- **Used for:** Protocol initialization, tool discovery and calls for search, explanations, quiz flow, and progress.
- **Worked well:** Named tools make the implementation inspectable and testable; tool calls can be shown in a visible trace.
- **Needs work:** More automated protocol conformance tests and a test with an external MCP client would improve confidence beyond the browser client.
- **Onboarding:** The key work is to make the endpoint, protocol version, tools/list, and tools/call path explicit. Public browser demo routes and the platform's OAuth-protected native /mcp route should be clearly distinguished.
- **Use again?** Yes; MCP fits inspectable multi-step integrations when protocol and authorization behavior are tested.

### Browser Web Speech APIs
- **Used for:** Optional speech input with Speech Recognition and spoken responses with Speech Synthesis.
- **Worked well:** No extra speech SDK dependency is needed in the web client.
- **Needs work:** Browser and OS support, microphone permission, recognition accuracy, language coverage, and voices vary.
- **Onboarding:** The capability can be quick to prototype, but browser compatibility and permission prompts must be tested on the exact demo device.
- **Use again?** Yes for graceful, optional speech controls; I would not make the whole experience depend on them.

### PostgreSQL persistence
- **Used for:** Saving the last topic, section, mastery estimate, action counts, and topics explored using a random anonymous key.
- **Worked well:** The save/read smoke test confirmed the progress row was persisted and retrieved.
- **Needs work:** A production deployment needs retention controls, rate limiting, monitoring, and clear consent/privacy notices.
- **Onboarding:** Schema migration and a small, parameterized query were straightforward within the hosted project.
- **Use again?** Yes for structured progress state; only after adding production-grade privacy and abuse controls.

### GitHub source repository
- **Used for:** Publishing the complete source, MIT license, README, demo script, and submission notes.
- **Worked well:** Reviewers can inspect the actual application, MCP handlers, migration, and helper code.
- **Needs work:** Repository naming and project metadata should be aligned before final submission.
- **Onboarding:** A contents API connection works for sequential file publication, but an empty repository may already contain a default README and require an update rather than a create call.
- **Use again?** Yes for source review and reproducibility.
