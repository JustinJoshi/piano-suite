# Chess Coach

Review your finished Lichess games with an AI coach. You paste a game, the
extension reads Lichess's server analysis, and a Paseo agent explains what to
do differently. For more information about Paseo, see the
[Paseo documentation](https://paseo.sh/docs).

The coach remembers your earlier reviews, so it can spot habits across games.
Use the coach to study finished games only. Don't use it during live games.
Every agent that the proxy spawns runs `zai/glm-5.3-flash`; the provider is
pinned by design.

## How it works

1. You paste the URL or ID of a finished Lichess game.
2. The extension downloads the game's server analysis from the Lichess API.
3. The extension measures how much the evaluation changes across each move, and
   then labels the move as `excellent`, `good`, `inaccuracy`, `mistake`, or
   `blunder`.
4. The extension sends the summary to the coach proxy.
5. The proxy runs your Paseo agent through the `paseo` CLI, and shows its reply
   in the sidebar.

```
Lichess API ──> extension ──> coach proxy ──> paseo CLI ──> Paseo daemon ──> GLM flash agent
```

The following table describes the components in the `chess-coach` directory:

| Path | Description |
| --- | --- |
| `shared/chess-analysis.js` | Parses the PGN, classifies moves, and builds the coach prompt |
| `extension/` | The sidebar user interface |
| `manifest.json` | The extension manifest; `chess-coach/` is the extension root |
| `server/coach-proxy.js` | Connects the extension to your Paseo daemon through the `paseo` CLI |
| `server/chess-coach-proxy.service` | The systemd user service for the proxy |
| `test/` | Tests for the analysis logic |

## Before you begin

You need the following:

- Node.js 22 or later
- A running Paseo daemon with the `zai` provider configured
- The `paseo` CLI in `~/.local/bin` or `PASEO_BIN` set to the node CLI binary
- A finished Lichess game with server analysis

To add server analysis to a game, open the game on lichess.org, go to the
analysis board, and request a full analysis. The analysis takes a few minutes.

## Set up the coach proxy

1. In the `chess-coach` directory, install the dependencies:

   ```
   npm install
   ```

2. Install and start the service:

   ```
   cp server/chess-coach-proxy.service ~/.config/systemd/user/
   systemctl --user daemon-reload
   systemctl --user enable --now chess-coach-proxy
   ```

   The proxy listens on `127.0.0.1:8787`. The proxy loads the daemon password
   from `~/.config/systemd/user/paseo.service.d/auth.conf` automatically.

To expose the proxy to your tailnet, add a dedicated TLS port. Don't change the
root serve rule:

```
tailscale serve --bg --https=8452 http://127.0.0.1:8787
```

Then verify the serve config. On this machine, pass the local hostname:

```
~/.config/opencode/verify-tailscale-setup.sh thinkpad.tail4f5d20.ts.net
```

For all settings, see [Configuration](#configuration) on this page.

## Load the extension in Chrome

1. Go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**, and select the `chess-coach` directory.
4. To open the side panel, click the **Chess Coach** button in the extensions
   toolbar.

## Load the extension in desktop Firefox

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**, and select the `chess-coach/manifest.json`
   file.
3. To open the coach, click the **Chess Coach** button in the toolbar. If you
   don't see the button, click the **Extensions** menu, and then click
   **Chess Coach**.

**Note:** Firefox removes temporary add-ons when you close Firefox. Load the
extension again in your next session.

## Use the extension on Firefox for Android

Firefox for Android has no sidebar, so the coach opens in a normal tab.

Prerequisites:

- Your phone is on your Tailscale network, so it can reach the proxy at
  `https://thinkpad.tail4f5d20.ts.net:8452`.
- The `web-ext` tool is installed on your computer, and USB debugging is set up
  between the computer and the phone. For more information, see
  [Developing extensions for Firefox for Android](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/).

To load and use the extension:

1. Connect the phone to the computer, and then run the following command in the
   `chess-coach` directory:

   ```
   web-ext run -t firefox-android --firefox-apk org.mozilla.firefox
   ```

2. On the phone, open Firefox, tap the **Extensions** menu, and then tap
   **Chess Coach**. The coach opens in a new tab.
3. In the **Coach proxy URL** field, check the address. The default is the
   tailnet address, which is correct for the phone. On a desktop browser, use
   `http://127.0.0.1:8787` instead.
4. Paste the game's Lichess URL or 8-character ID, and then tap
   **Analyze with coach**.

**Note:** Firefox for Android doesn't show a prompt for host-permission
requests. The extension asks for lichess.org and the proxy address at install
time, and Android grants them silently.

## Review a game

1. In the coach panel, paste the game's Lichess URL or 8-character ID.
2. Optional: to ask about a specific moment, type your question in the
   **Your question** field.
3. Click **Analyze with coach**.

The summary shows your accuracy, the number of moves in each class, and the
three most costly moves. The coach reply follows the summary.

To start a fresh coach with no memory, click **New coach**.

## Configuration

The proxy reads these environment variables. The service file sets
`PASEO_BIN` and `TERM`; all others have working defaults:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8787` | The proxy port |
| `PASEO_URL` | `ws://127.0.0.1:6768/ws` | The Paseo daemon address |
| `PASEO_PASSWORD` | from the paseo auth.conf drop-in | The daemon password |
| `PASEO_BIN` | `paseo` | The CLI binary; set this to `/usr/lib/paseo/packages/cli/bin/paseo` in services, because `/usr/bin/paseo` is the Electron wrapper and hangs headless |
| `CHESS_COACH_CWD` | `chess-coach` | The working directory for agent sessions |
| `CHESS_COACH_AGENT_ID` | stored session | An agent ID to pin the coach to, instead of the stored session |

## Move classification

Lichess reports evals in centipawns from White's point of view. The extension
converts each move's eval change to the mover's point of view. Fewer lost
centipawns is better:

- `excellent`: 10 or fewer
- `good`: 11–50
- `inaccuracy`: 51–100
- `mistake`: 101–300
- `blunder`: more than 300

The extension converts mate scores such as `#3` to values that rank above any
centipawn eval.

## Limitations

- Games without server analysis have no evals, so the coach can't review them.
- The coach reads finished games only. It doesn't watch live games.
- Coach memory lives in one agent session. To clear the memory, click
  **New coach**.
- The coach prompt forbids tool use. If an agent ends in the `permission`
  status, approve or stop it in the Paseo app, and then try again.

## Run the tests

In the `chess-coach` directory, run the tests:

```
npm test
```
