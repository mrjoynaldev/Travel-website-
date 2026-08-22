#!/usr/bin/env bash
# CodeReport Global end-to-end smoke test.
# Usage: CRG_TOKEN=crg_... bash cli/smoke.sh [slug]
set -u
SITE="https://codereportglobal.indevs.in"
API="https://codereportglobal-backend.onrender.com"
ADMIN="https://codereportglobal-admin.vercel.app"
TOKEN="${CRG_TOKEN:-}"
SLUG="${1:-rust-glancer-vscode-setup}"
PASS=0; FAIL=0

check() { # name expected actual
  local name="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then PASS=$((PASS+1)); echo "PASS  $name";
  else FAIL=$((FAIL+1)); echo "FAIL  $name (expected: $expected | got: $actual)"; fi
}
atleast() { [ "$1" -ge "$2" ] && echo 1 || echo 0; }
code() { curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$1"; }
body() { curl -s --max-time 30 "$@"; }

echo "== Public website =="
check "homepage"                 200 "$(code "$SITE/")"
check "robots meta (Discover)"   1   "$(body "$SITE/" | grep -c 'max-image-preview:large')"
check "article page"             200 "$(code "$SITE/articles/$SLUG")"
check "NewsArticle JSON-LD"      1   "$(atleast "$(body "$SITE/articles/$SLUG" | grep -c 'NewsArticle')" 1)"
check "BreadcrumbList JSON-LD"   1   "$(atleast "$(body "$SITE/articles/$SLUG" | grep -c 'BreadcrumbList')" 1)"
check "canonical link"           1   "$(body "$SITE/articles/$SLUG" | grep -c 'rel="canonical"')"
check "robots.txt"               200 "$(code "$SITE/robots.txt")"
check "robots Sitemap lines"     1   "$(atleast "$(body "$SITE/robots.txt" | grep -c 'Sitemap:')" 1)"
check "sitemap.xml"              200 "$(code "$SITE/sitemap.xml")"
check "sitemap lastmod"          1   "$(atleast "$(body "$SITE/sitemap.xml" | grep -c 'lastmod')" 1)"
check "news-sitemap.xml"         200 "$(code "$SITE/news-sitemap.xml")"
check "rss.xml"                  200 "$(code "$SITE/rss.xml")"
check "rss full content"         1   "$(atleast "$(body "$SITE/rss.xml" | grep -c 'content:encoded')" 1)"

echo "== Docs (agent surface) =="
for f in SEO-GOOGLE.md POST-WRITING-SKILL.md AI-EDITOR-AGENT.md API-ACCESS.md distribute.mjs setup.sh gravity.mjs blog.mjs; do
  check "/docs/$f" 200 "$(code "$SITE/docs/$f")"
done
check "SKILL §10 publish-gate"   1   "$(atleast "$(body "$SITE/docs/POST-WRITING-SKILL.md" | grep -c 'Official Google Search compliance')" 1)"

echo "== Backend API =="
check "healthz"                  200 "$(code "$API/healthz")"

TRPC="$API/api/trpc"
AUTH="Authorization: Bearer $TOKEN"
QIN='?input=%7B%22json%22%3A%7B%7D%7D'

echo "== Authenticated tRPC (Bearer CRG token) =="
[ -n "$TOKEN" ] || { echo "FAIL  no CRG_TOKEN provided"; FAIL=$((FAIL+1)); }
DIST=$(curl -s --max-time 30 -H "$AUTH" "$TRPC/distribution.list$QIN")
check "distribution.list auth"   0   "$(echo "$DIST" | python3 -c "
import json,sys
try:
  d=json.load(sys.stdin)['result']['data']['json']
  items=d if isinstance(d,list) else d.get('items',[])
  print(0 if len(items)>=3 else 1)
except Exception as e:
  print('ERR '+str(e))")"
check "queue rows pending=3"     3   "$(echo "$DIST" | python3 -c "
import json,sys
d=json.load(sys.stdin)['result']['data']['json']
items=d if isinstance(d,list) else d.get('items',[])
print(sum(1 for i in items if i.get('status')=='pending'))")"
check "devto row carries draftId" 4459214 "$(echo "$DIST" | python3 -c "
import json,sys
d=json.load(sys.stdin)['result']['data']['json']
items=d if isinstance(d,list) else d.get('items',[])
rows=[i for i in items if i.get('channel')=='devto' and i.get('status')=='pending']
print(rows[0].get('payload',{}).get('articleId','missing') if rows else 'no-row')")"

BYSLUG=$(curl -s --max-time 30 "$TRPC/blog.bySlug?input=%7B%22json%22%3A%7B%22slug%22%3A%22$SLUG%22%7D%7D")
check "blog.bySlug published"    1   "$(echo "$BYSLUG" | python3 -c "
import json,sys
p=json.load(sys.stdin)['result']['data']['json'].get('post',{})
print(1 if p.get('slug')=='$SLUG' and p.get('title') else 0)")"
check "bySlug has rendered_html" 1   "$(echo "$BYSLUG" | python3 -c "
import json,sys
p=json.load(sys.stdin)['result']['data']['json'].get('post',{})
print(1 if len(p.get('rendered_html',''))>1000 else 0)")"

TRACK=$(curl -s --max-time 30 -X POST "$TRPC/blog.track" -H 'Content-Type: application/json' \
  -d '{"json":{"eventType":"scroll_depth","properties":{"depth_percent":75,"smoke":true}}}')
check "analytics track event"    true "$(echo "$TRACK" | python3 -c "import json,sys; print(str(json.load(sys.stdin)['result']['data']['json'].get('success')).lower())")"

echo "== Admin Studio =="
check "studio distribution page" 200 "$(code "$ADMIN/studio/distribution")"

echo ""
echo "RESULT: $PASS passed, $FAIL failed"
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
