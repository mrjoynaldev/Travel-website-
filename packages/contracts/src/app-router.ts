/**
 * Type-only re-export of the tRPC root router so both the public website and
 * the Studio get type-safe clients without pulling the API implementation into
 * their bundles. This file must never be imported at runtime — always
 * `import type`.
 */
import type { AppRouter } from "@fieldnote/api/src/routers";

export type { AppRouter };
