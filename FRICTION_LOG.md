# Friction Log — StudySaathi Voice

These entries describe actual development and verification friction encountered while building the prototype. They are not claims that Hatchable or MCP has a confirmed product defect.

## 1. Static home page not found during initial preview check

- **Task attempted:** Open the deployed web app as an anonymous visitor and verify the home page.
- **Steps taken:** Opened the preview root URL; received a “Not found” response. Checked the project's file manifest and verified the public JavaScript and CSS were present while the expected home-page entry file was absent. Added `public/index.html`, ran deployment validation, redeployed, and checked the root HTML and browser DOM.
- **Expected:** The root URL would display the StudySaathi home page after deploy.
- **Actual:** The root returned 404/“Not found” during the first browser-level check.
- **Severity:** High — the judges would not be able to use the app if the entry page were missing.
- **Workaround:** Restored `public/index.html`, redeployed, and re-tested. The fresh preview returned HTTP 200 and contained the expected StudySaathi heading and chat form; a browser interaction then completed the MAC-unit explanation.
- **Actionable suggestion:** Add a deployment warning or example test for a public static app when assets exist but `public/index.html` is missing. Add root-page smoke verification to the release checklist.

## 2. Anonymous test of native MCP route returned an OAuth error

- **Task attempted:** Verify the native `/mcp` URL by sending an unauthenticated JSON-RPC initialize request.
- **Steps taken:** Sent a POST request to `/mcp` with the expected JSON-RPC initialize payload and MCP protocol header.
- **Expected:** A direct anonymous request could reach the handler for a quick protocol smoke test.
- **Actual:** The native MCP endpoint returned HTTP 401 with a missing/invalid access-token message. This is consistent with the platform's OAuth-protected native MCP route; it is not evidence of a broken handler.
- **Severity:** Medium — the behavior was initially surprising during rapid verification and made anonymous testing less direct.
- **Workaround:** Verified tool registration through the platform tool listing and used the browser-facing `/api/mcp` endpoint for the explicitly permitted Alexa+ simulated-experience path. Tested initialization, tool listing, explanation, quiz generation, quiz answer checking, and progress save/read.
- **Actionable suggestion:** Make authentication differences between the OAuth-protected native `/mcp` endpoint and an app's public simulation endpoint very explicit in starter templates and quick-start guides.
