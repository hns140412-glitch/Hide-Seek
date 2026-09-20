# Hide & Seek Deployment UI Review — REV_08 WORLD MIGRATION

Status: DEPLOYMENT UI BASELINE — CURRENT
Master: `Hide_Seek_UI_MASTER_LOGIC_REV_04.md`

## Review conclusion

The active visual baseline is an original treasure-seek / hide-and-seek / hidden-word exploration world. Runtime UI uses raster artwork only for background, character and decorative illustration. Functional copy, word spelling, buttons, choices, progress, Letter Keys, Blank Slots and gauges remain live HTML/CSS/JS.

## Required corrections

- Product identity is **Hide & Seek**.
- Home priority remains **사진으로 시험지 만들기**.
- USER is protagonist; GUIDE is companion/exploration friend.
- Current learning path is `FIRST FIND → MEANING CLUE → CONNECTION TRAIL → HIDDEN WORDS → FINAL SEEK → SEEK AGAIN`.
- Final spelling retrieval keeps partial spelling + Blank Slots + mixed Letter Key Tray, with Drag & Drop and Tap fallback.
- Wrong Letter Key is rejected immediately and does not occupy a slot.
- Guide remains secondary to the learning task and never covers question/CTA/Key/Slot areas.
- World palette should support forest/trail/treasure/island exploration rather than police-state visual coding.
- Functional text is never dependent on generated-image typography.

## World regression gate

FAIL if the current approved UI shows or normalizes back to:
- Hide & Seek as the current product title,
- police/detective/arrest framing,
- 수사 / 사건 / 사건 파일 / 체포 / 검거 / 범인 terminology,
- police badge/siren/case-file identity as the dominant experience.

## Visual pass criteria

- Bright, original hidden-word exploration world.
- Treasure, trail, map, clue and seek metaphors may be used.
- No commercial character names/logos.
- Task > learning information > progress > guide > decoration hierarchy.
- Photo-first home entry remains dominant.
- Final spelling retrieval remains functionally clear.
- Narrow mobile widths do not introduce horizontal page overflow.

## Known limitation

The user-photo avatar in this static PWA is a local privacy-preserving Canvas stylization, not a server-side generative redraw. This is optional and does not block worksheet creation or learning.
