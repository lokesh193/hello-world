# StudySaathi Voice

**Accessible AI study companion for blind and low-vision college students.**

StudySaathi turns study into an accessible voice-first workflow: ask for a concept explanation, hear a sequential DSP diagram description, practise a question, and continue from saved progress. It is designed as a web-based Alexa+-style simulation and includes both a browser-facing Streamable HTTP JSON-RPC endpoint and native Hatchable MCP tool definitions.

> **Transparency:** This is a hackathon prototype, not an Amazon product and not a native Alexa+ integration. The Alexa+ developer toolkit is not exposed to general hackathon participants, so the web experience is clearly labelled as a simulation. Diagram narration currently uses built-in templates or a learner-supplied text description; this version does not run OCR/vision on uploaded images. The deterministic ECE study pack is a limited reference source, not a full generative tutor.

## Demo URL

After deployment, open the public-facing StudySaathi URL shown in the project console. If the project is private, switch visibility to public in project Settings before sharing it with judges.

## Features

- Responsive study workspace with keyboard navigation, focus indicators, skip link, live status messages, and high-contrast toggle.
- Speech synthesis for spoken explanations and browser speech recognition where supported.
- ECE study pack covering DSP architecture, FIR filters, Q15 representation, MAC units, and circular buffers.
- MCP tools: `search_study_material`, `explain_concept`, `describe_diagram`, `start_quiz`, `check_quiz_answer`, `save_progress`, and `get_progress`.
- Quiz feedback is checked against a deterministic answer key.
- Anonymous progress storage. Full notes stay in local browser storage and are not saved by progress tools.
- Visible trace of the MCP calls made by the web client.

## Architecture

```text
Student (keyboard, speech input or screen reader)
        |
        v
Accessible web client (public/index.html + app.js)
        |
        | JSON-RPC 2.0 over Streamable HTTP POST
        v
/api/mcp  -- browser demo endpoint
        |
        v
Search / explain / diagram narration / quiz / progress tools
        |
        v
PostgreSQL study_progress table (progress only)

Native MCP tools are also registered at /mcp from mcp/*.js using Hatchable's MCP interface.
```

## Protocol and MCP server

- Protocol requested by the client: `2025-11-25`.
- The browser client negotiates protocol version, sends `notifications/initialized`, lists tools, and calls them through JSON-RPC.
- Browser demo endpoint: `/api/mcp`.
- Platform-native MCP endpoint: `/mcp` (OAuth / access behaviour is controlled by the hosting platform).
- Tool definitions live in `mcp/`, with shared reference content in `lib/study.js`.
- The app offers JSON responses over Streamable HTTP; server-initiated SSE is not implemented in this stateless prototype.

## Run / deploy

The hosted project runs on Hatchable. To run on a different compatible JavaScript server, adapt the Hatchable SDK database calls in the API and MCP tool handlers to your host's database client and mount the MCP route with the Streamable HTTP transport.

No npm dependencies are needed by the hosted project. The public client uses the browser's built-in Web Speech APIs where available.

## Test checklist

1. Open the study session and confirm the status says MCP tools connected.
2. Use **Explain MAC unit**; inspect **Tool activity** and verify a real `explain_concept` tool call appears.
3. Start a quiz; select an answer and verify `check_quiz_answer` returns correctness and rationale.
4. Visit **Learning progress**, reload, and verify the last topic persists.
5. Visit **MCP tools** and inspect tool discovery and JSON-RPC traces.
6. Test keyboard navigation, a screen reader, reduced-motion mode, and high-contrast setting.
7. Confirm the demo never asks for a student's real name, student ID, password, or other direct identifiers.

## Limitations

- The bundled ECE knowledge set is intentionally small and hand-authored.
- Learner notes are passed with a tool request but are not saved server-side; explanations remain transparently labelled as built-in reference content rather than pretending the deterministic server has generated a novel interpretation of arbitrary material.
- Diagram description is a generic verbal template or a narration of text supplied by the learner, not image understanding.
- Speech recognition availability and its language quality depend on the browser and OS.
- Progress mastery is an illustrative learning estimate, not an official academic grade.

## Product feedback (for submission)

**What worked:** A hosted endpoint with named MCP tools and visible tool-call traces makes the integration inspectable. The no-build web client can be iterated quickly and the database supports persistent progress.

**What needs work:** Real production deployments would benefit from schema validation and protocol conformance tests, rate limiting and abuse protection on public endpoints, better multilingual speech input, OCR/diagram-image extraction, and integration with an actual conversational model grounded in the student's notes.

**Would build with it again:** Yes for a fast hosted prototype; for production use, add user-scoped data access, rate limits, stronger evaluation of educational accuracy, and a more capable MCP client test suite.

## License

MIT. See [LICENSE](LICENSE).