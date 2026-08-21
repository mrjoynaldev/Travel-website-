# CodeReport Global — API Access & CLI

Programmatic access to manage your publication from the command line (or any
script/CI job) using **scoped, revocable access tokens**.

- **Where tokens live:** Studio → **API tokens** (`/studio/api-tokens`).
- **How auth works:** the token is sent as `Authorization: Bearer crg_…` and
  resolves to the owning contributor's profile, so it inherits exactly the
  same role-scoped permissions as that user.
- **Token safety:** only the SHA-256 hash is stored. The full token is shown
  **once** at creation and can never be recovered afterward.

---

## 1. Create a token

1. Sign in to Studio as an **admin**.
2. Open **API tokens** in the sidebar.
3. Choose a name (e.g. `CI publisher`) and a scope:
   - **Read & write** (`read`, `write`) — full management.
   - **Read only** (`read`) — can list/read but cannot create, edit, or delete.
4. Click **Create token** and copy the `crg_…` value immediately. Store it in
   a secret manager or environment variable (e.g. `CRG_TOKEN`).

Tokens can be **revoked** at any time from the same screen. Revocation takes
effect immediately. Optional expiry is available at creation.

---

## 2. Configure the CLI

The CLI is a zero-dependency-of-your-own Node script at `cli/blog.mjs`.

```bash
# Required
export CRG_TOKEN="crg_…"

# Optional (defaults to https://codereportglobal-backend.onrender.com)
export CRG_API_URL="https://codereportglobal-backend.onrender.com"

# Quick self-check
node cli/blog.mjs whoami
```

`whoami` prints the publication + role the token is acting as:

```json
{
  "actor": { "role": "admin", "organizationId": "…", "siteId": "…" },
  "site":  { "name": "CodeReport Global", "slug": "…" }
}
```

> The token can also be passed inline: `node cli/blog.mjs --token=crg_… whoami`.

---

## 3. Command reference

```
node cli/blog.mjs <command> [options]
```

### Account
| Command | Description |
|---|---|
| `whoami` | Show the publication + role for this token |

### Posts
| Command | Description |
|---|---|
| `posts list [--status <s>] [--search <q>]` | List posts (`draft\|review\|published\|archived`) |
| `posts get <id>` | Fetch a single post with taxonomy |
| `posts create [fields]` | Create a draft — all fields supported |
| `posts update <id> [fields]` | Update any field (merged with current) |
| `posts submit <id>` | Draft → review |
| `posts publish <id>` | Review → published (live) |
| `posts archive <id>` | Archive a post |
| `posts delete <id>` | Soft-delete (move to trash) |
| `posts feature <id> [--off]` | Toggle homepage feature flag |
| `posts schedule <id> --at <iso>\|--clear` | Schedule / clear publication |

Post fields: `--title --slug --excerpt --meta-title --meta-description
--canonical --og-image --thumbnail <asset-id|url> --category <name> (repeatable,
auto-created) --tag <name> (repeatable, auto-created) --gravity-file <path>
--file <path> --body <text>`. Gravity JSON files are converted to published
HTML by the CLI (`cli/gravity.mjs`).

### Media
| Command | Description |
|---|---|
| `media list [--folder <f>] [--search <q>]` | List library assets |
| `media upload --file <path> [--alt <t>] [--caption <c>] [--folder <f>] [--mime <type>]` | Upload image/audio/video/document; returns asset id + URL |

### Taxonomy
| Command | Description |
|---|---|
| `categories list` | List categories |
| `categories create --name <n> [--description <d>]` | Create a category |
| `tags list` | List tags |
| `tags create --name <n>` | Create a tag |

### Audience & insights
| Command | Description |
|---|---|
| `subscribers list` | List newsletter subscribers |
| `analytics` | 30-day analytics summary |
| `export [--format json\|markdown]` | Full content export |

### Examples

```bash
# Publish a complete article from a Gravity JSON file
node cli/blog.mjs posts create \
  --title "V8 ships built-in JIT for WASM" \
  --slug "v8-wasm-jit" \
  --excerpt "What the new pipeline means for your bundles." \
  --meta-description "V8's new WASM JIT cuts cold-start 40%. Benchmarks, migration notes, and what changes for your build." \
  --category "AI News" --tag "v8" --tag "webassembly" \
  --thumbnail 9f3c…-… --og-image https://…/cover.jpg \
  --gravity-file ./article.gravity.json
node cli/blog.mjs posts submit <id>
node cli/blog.mjs posts publish <id>

# Upload a cover with alt text, then attach it
node cli/blog.mjs media upload --file cover.jpg --alt "Release timeline chart" --folder featured
node cli/blog.mjs posts update <id> --thumbnail <asset-id>

# Audit everything that's still in review
node cli/blog.mjs posts list --status review
```

---

## 4. Headless access via HTTP

Under the hood the CLI talks to the same tRPC API the Studio uses:

```
POST {CRG_API_URL}/api/trpc/<procedure>?batch=1
Authorization: Bearer crg_…
Content-Type: application/json
```

The typed router surface (procedures + inputs) is exported from
`packages/contracts/src/app-router.ts` (`@shared/app-router`). Available
procedure groups: `blog` (public), `auth`, `studio` (posts, taxonomy, media,
moderation, people, analytics, notifications, settings, pages, audit, sections,
capabilities, subscribers, apiTokens, exportContent), `ai`, `agent`, `llm`.

### Scope enforcement

- `read`-only tokens are **blocked from every mutation** by the API with
  `FORBIDDEN` ("read-only").
- All token-authenticated requests still pass the role checks (`admin` /
  `editor` / `author`) and tenant scoping (`organization_id` + `site_id`).
- Every consequential action is written to the **audit log** — including token
  creation and revocation themselves.

---

## 5. Security notes

- Treat `crg_…` tokens like passwords. Never commit them; rotate on suspicion.
- The service-role key is **not** required by the CLI — it uses your scoped
  token instead, so blast radius is limited to the owning user's role.
- Revoke a token instantly from Studio → API tokens if it leaks.
