#!/usr/bin/env bash
# Sundarban Yatri end-to-end smoke test.
# Usage: SY_TOKEN=sy_... bash cli/smoke.sh [slug]
set -u
SITE="https://sundarbanyatra.in"
API="https://sundarbanyatra.in"
ADMIN="https://sundarbanyatra.in"
TOKEN="${SY_TOKEN:-$SY_TOKEN}"
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
check "SKILL §9 comprehensive"   1   "$(atleast "$(grep -c 'COMPREHENSIVE POST SKILL' docs/POST-WRITING-SKILL.md)" 1)"
check "SKILL §9 blue links"      1   "$(atleast "$(grep -c 'Blue link method' docs/POST-WRITING-SKILL.md)" 1)"

echo "== Backend API =="
check "healthz"                  200 "$(code "$API/healthz")"

TRPC="$API/api/trpc"
AUTH="Authorization: Bearer $TOKEN"
QIN='?input=%7B%22json%22%3A%7B%7D%7D'

echo "== Authenticated tRPC (Bearer CRG token) =="
[ -n "$TOKEN" ] || { echo "FAIL  no SY_TOKEN provided"; FAIL=$((FAIL+1)); }
DIST=$(curl -s --max-time 30 -H "$AUTH" "$TRPC/distribution.list$QIN")
check "distribution.list auth"   0   "$(echo "$DIST" | python3 -c "
import json,sys
try:
  d=json.load(sys.stdin)['result']['data']['json']
  items=d if isinstance(d,list) else d.get('items',[])
  print(0 if len(items)>=3 else 1)
except Exception as e:
  print('ERR '+str(e))")"
check "queue rows pending>=1"    1   "$(echo "$DIST" | python3 -c "
import json,sys
d=json.load(sys.stdin)['result']['data']['json']
items=d if isinstance(d,list) else d.get('items',[])
print(1 if sum(1 for i in items if i.get('status')=='pending')>=1 else 0)")"
check "posted rows exist"        1   "$(echo "$DIST" | python3 -c "
import json,sys
d=json.load(sys.stdin)['result']['data']['json']
items=d if isinstance(d,list) else d.get('items',[])
print(1 if any(i.get('status')=='posted' for i in items) else 0)")"
check "devto row carries draftId" 4459214 "$(echo "$DIST" | python3 -c "
import json,sys
d=json.load(sys.stdin)['result']['data']['json']
items=d if isinstance(d,list) else d.get('items',[])
rows=[i for i in items if i.get('channel')=='devto' and i.get('status')=='pending']
print(rows[0].get('payload',{}).get('articleId','missing') if rows else 'no-row')")"
check "og:image render 1200x630" 1   "$(atleast "$(body "$SITE/articles/$SLUG" | grep -c 'render/image.*width=1200.*height=630')" 1)"

# Kit generation — comprehensive link + media skill per POST-WRITING-SKILL.md §9
if [ -n "$TOKEN" ]; then
  rm -rf /tmp/smoke-kit && SY_TOKEN="$TOKEN" node cli/distribute.mjs kit "$SLUG" --out /tmp/smoke-kit >/dev/null 2>&1
  check "kit devto.md teaser"        1 "$(test -f /tmp/smoke-kit/devto.md && grep -q 'canonical_url:' /tmp/smoke-kit/devto.md && awk 'END{print (NR<80)?1:0}' /tmp/smoke-kit/devto.md)"
  check "kit devto cover 1000x420"   1 "$(grep -c 'cover_image:' /tmp/smoke-kit/devto.md 2>/dev/null | awk '{print ($1>=1)?1:0}')"
  check "kit bluesky blue link"      1 "$(grep -c 'https://sundarbanyatra.in/articles/' /tmp/smoke-kit/bluesky.txt 2>/dev/null | awk '{print ($1>=1)?1:0}')"
  check "kit bluesky ≤300 graphemes" 1 "$(python3 -c "import sys; t=open('/tmp/smoke-kit/bluesky.txt',encoding='utf-8').read() if __import__('os').path.exists('/tmp/smoke-kit/bluesky.txt') else sys.exit(1); import unicodedata; print(1 if len(unicodedata.normalize('NFC',t))<=300 else 0)" 2>/dev/null || echo 0)"
  check "kit facebook txt"           1 "$(test -f /tmp/smoke-kit/facebook.txt && grep -q 'https://' /tmp/smoke-kit/facebook.txt && echo 1 || echo 0)"
  check "kit instagram txt"          1 "$(test -f /tmp/smoke-kit/instagram.txt && grep -q 'https://' /tmp/smoke-kit/instagram.txt && echo 1 || echo 0)"
  check "instagram 1080x1350 render" 1 "$(grep -q '1080.*1350' cli/distribute.mjs && echo 1 || echo 0)"
  check "facebook API channel"       1 "$(grep -q '\"facebook\"' apps/api/src/routers/distributionRouter.ts && echo 1 || echo 0)"
  check "instagram API channel"      1 "$(grep -q '\"instagram\"' apps/api/src/routers/distributionRouter.ts && echo 1 || echo 0)"
fi

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
