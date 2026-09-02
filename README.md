# Custom Discord Bot

## Slash commands
- **`/mention`** – mention a member or role, with an optional message
- **`/create-channel`** – create a text or voice channel (optionally inside a category)
- **`/delete-channel`** – delete a channel by name
- **`/feedback`** – opens a modal popup form (subject + details)

## Creator onboarding/offboarding workflow (prefix commands, `!`)
All of these only work in **#management-commands** and only for members with the **@Reddit Lead** role. Edit `config.js` if your channel/role names differ.

### `!announce`
Posts a button. Clicking it opens a **modal popup** asking for:
FBA ID - Creator name, Other socials, OnlyFans tag, Niches, Dos and donts.
On submit, the bot posts the info to **#onboarding-announcements**, mentions **@Reddit Page Runner**, and adds a ✅ reaction for them to click.

### `!assign FBA ID - Creator Name`
1. Creates a **private channel** named after the creator (hidden from `@everyone`).
2. Sends a **role select menu** asking which roles should see it.
3. Grants those roles access, then places the channel in a matching **category** (if a selected role's name matches an existing category, e.g. `@Neal` → category "Neal"; otherwise creates a new category named after the first selected role — tweak this matching logic in `handlers/assign.js` if you want something stricter).
4. Automatically sends the **onboarding checklist** (see below), mentioning @Reddit Lead.

Onboarding checklist items (each a toggle button):
- PR joins the PRxAM channel
- Notify AMs to whitelist
- Create Dropbox folder
- Create posting sheet
- Assign an account
- Update masterlist

When all are checked, the bot mentions the roles that were assigned access to the channel.

### `!offboard FBA ID - Creator`
1. Deletes the creator's private channel.
2. Sends the **offboarding checklist**:
   - Update masterlist
   - Dropbox folder deleted
   - Posting sheet deleted
   - Notify AMs "all clear"

When all are checked, the bot posts a completion message.

State (which creator maps to which channel/roles/checklist progress) is stored in `data.json`, created automatically next to `index.js`. Back this up or swap in a real database if you outgrow a single JSON file.

---

## 1. Create the bot on Discord's Developer Portal

1. Go to https://discord.com/developers/applications → **New Application**.
2. **Bot** tab → **Add Bot**. Copy the **Token**.
3. Still on the **Bot** tab, enable **all three Privileged Gateway Intents**:
   - Presence Intent (not required, but harmless to enable)
   - **Server Members Intent** (required)
   - **Message Content Intent** (required — this is how the bot reads `!announce`, `!assign`, `!offboard`)
4. **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Manage Channels`, `Manage Roles`, `Send Messages`, `Mention Everyone`, `Add Reactions`, `Use Slash Commands`
   - Open the generated URL and invite the bot to your server.
5. Copy your **Application (Client) ID** from **General Information**.

**Role hierarchy note:** the bot's own role must sit **above** any role it manages permissions for (e.g. above @Neal, @Reddit Page Runner) in Server Settings → Roles, or the permission changes will fail.

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `DISCORD_TOKEN`, `CLIENT_ID`, and optionally `GUILD_ID` (for instant slash-command updates while testing).

## 4. Check config.js

Open `config.js` and confirm the channel/role names match your server exactly (case-sensitive):

```js
MANAGEMENT_CHANNEL_NAME: 'management-commands',
ONBOARDING_ANNOUNCE_CHANNEL_NAME: 'onboarding-announcements',
LEAD_ROLE_NAME: 'Reddit Lead',
PAGE_RUNNER_ROLE_NAME: 'Reddit Page Runner',
```

## 5. Register slash commands

```bash
npm run deploy
```

## 6. Run the bot

```bash
npm start
```

Test it: in #management-commands, as a @Reddit Lead, try `!announce`, then `!assign SomeFBA123 - Jane Doe`, complete the onboarding checklist, then `!offboard SomeFBA123 - Jane Doe`.

## Project structure

```
discord-bot/
├── commands/                  # slash commands (/mention, /create-channel, /delete-channel, /feedback)
├── handlers/
│   ├── announce.js            # !announce button + modal + posting
│   ├── assign.js               # !assign channel creation, role select, category placement
│   ├── onboarding.js          # sends the onboarding checklist
│   ├── offboard.js            # !offboard channel deletion + checklist
│   └── checklist.js           # shared checklist button logic (onboarding + offboarding)
├── config.js                  # channel/role names — edit this to match your server
├── store.js                   # simple JSON-file persistence (data.json, auto-created)
├── index.js                   # wires up prefix commands + slash commands + interactions
├── deploy-commands.js         # registers slash commands with Discord
├── package.json
└── .env.example
```

## Hosting

Needs a persistent Node.js process (avoid free serverless platforms that sleep). A small VPS, Railway, or Render works well. Make sure `data.json` is on persistent storage, not an ephemeral filesystem, or checklist progress will reset on redeploy.

### Deploying to Railway

1. Push this project to a GitHub repo (`.env` is already gitignored, so your token won't be uploaded).
2. On [railway.app](https://railway.app), create a **New Project** → **Deploy from GitHub repo** → select your repo.
3. In the **Variables** tab, add `DISCORD_TOKEN`, `CLIENT_ID`, and optionally `GUILD_ID`.
4. Add a **Volume** to the service (e.g. mounted at `/data`), then set the variable `DATA_DIR=/data`. This keeps `data.json` — and all your creator/checklist records — safe across redeploys.
5. Confirm the **Start Command** is `npm start` (Railway usually detects this automatically from `package.json`).
6. Slash commands only need registering once: run `npm run deploy` locally with your real `.env` filled in before your first deploy, or use Railway's one-off command runner if your plan includes it.
7. Push your code — Railway builds and starts the bot automatically. Check the **Deployments → Logs** tab for `Logged in as YourBotName#0000` to confirm it's live.
