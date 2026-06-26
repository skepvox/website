// Type-only closed-union guard (Slice C1). vue-tsc checks .vitepress/** (tsconfig include); this file
// is imported by nothing, so it is never bundled. It asserts that ReaderIconName is a CLOSED union —
// an unknown name is a compile error. If the @ts-expect-error below ever stops erroring (the union was
// widened/weakened), vue-tsc flags the unused @ts-expect-error and `pnpm run type` fails: the guard.
import type { ReaderIconName } from './reader-icons'

// Every v1 name is assignable:
const _validNames: ReaderIconName[] = ['chevron-left', 'chevron-right', 'chevron-up', 'disclosure']
void _validNames

// @ts-expect-error — 'contents' is a DEFERRED glyph (assessment §6), not a v1 ReaderIconName.
const _rejectedName: ReaderIconName = 'contents'
void _rejectedName
