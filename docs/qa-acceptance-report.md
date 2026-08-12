# QA Acceptance Report

## Scope and test identity

The acceptance suite used clearly labeled `qa-e2e-*` profile identities, `example.test` email addresses, a `qa-lifecycle` category and tag, and non-promotional QA content. No testimonials, customer reviews, ratings, production user identity, or authentication bypass were used. The test exercised the application's typed protected and public procedures against the configured Supabase database.

| Field | Recorded value |
|---|---|
| QA artifact | `816bc112-fe95-4d68-8de3-323cd08d3d44` |
| QA slug | `qa-lifecycle-mspjwcqy` |
| Final state | `archived` |
| Identity roles exercised | Author, Editor, Administrator, anonymous public reader, subscriber, comment author |
| Test suite | `server/qa.lifecycle.test.ts` |
| Result | Passed: 2 tests, including retained archival audit verification |

An additional temporary QA route artifact, `e655ac29-9cd3-4647-b5ce-c796566d0ba7` (`qa-public-routes-mspjzpmc`), was published solely to verify the actual server-rendered public pages. It was archived immediately after the check.

## Verified lifecycle

The Author created the post in `draft`, submitted it to `review`, and the Editor moved it to `published`. A public reader then accessed the published article through its slug, query search, category and tag filters, author page, and year archive. The test recorded article-view and reading-completion events, submitted a pending public comment, subscribed a QA email address before publication, and then verified editor moderation and the resulting approved public comment.

The Administrator verified analytics totals, review-submitted and author-approval outbox records, subscriber publication outbox records, SEO title and description storage, and editorial audit entries. The Editor finally transitioned the post to `archived`. A second test confirmed the archived record and its `post.workflow_transition` audit evidence remain accessible through authorized administration procedures.

## Test outcomes

| Area | Result |
|---|---|
| Author draft creation and taxonomy assignment | Passed |
| Exact draft → review → published → archived graph | Passed |
| Public by-slug article reading and stored metadata | Passed |
| Search, category, tag, author, and year archive discovery | Passed |
| Reader analytics and subscriber persistence | Passed |
| Pending comment, editor moderation, and approved public display | Passed |
| Review, approval, and subscriber-publication notification outbox entries | Passed |
| Retained archival state and audit evidence | Passed |
| Actual SSR article, topic, tag, archive-index, and yearly-archive pages | Passed |

## Corrective findings resolved during testing

The lifecycle test found a malformed public search OR expression, which prevented title/excerpt results from being returned in combined search. The public query was corrected and the test rerun successfully. It also found that joined editor profiles could be returned by the data client as a single object rather than an array, preventing review-submission notifications from identifying recipients. The notification fan-out now supports both result shapes and is covered by the passing lifecycle suite.

The actual public-route test also found that the server-rendering prefetch map had not been extended when topic, tag, and archive pages were introduced. Those pages therefore returned 404 to crawlers despite being available client-side. The SSR prefetch map now hydrates their category, tag, archive, and filtered-list queries, and the server-rendered route test passes.

## Remaining validation boundary

The QA suite uses synthetic server request contexts to exercise the same authorization procedures and data paths, but it does **not** replace a real browser sign-in session. A final browser-based role test remains required after a real administrator, editor, and author have completed normal sign-in. The project does not include an OAuth bypass for QA users.
