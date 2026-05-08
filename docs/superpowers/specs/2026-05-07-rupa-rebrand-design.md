# Rupa Rebrand Design

## Task Contract

Rename the mobile app brand from Next Move to Rupa and apply the first-pass Rupa visual identity.

The change should cover user-visible app identity, app metadata, app icons, primary brand text, and core brand color usage in the Expo app. The existing product flow, simulation behavior, API contracts, and route detection logic are out of scope.

Owned files are expected to be in:

- `app.json`
- `package.json` and lockfile only if package identity is intentionally changed
- `app/`
- `src/components/`
- `src/store/` for persisted storage key naming if needed
- `docs/product.md`
- `assets/` references for Rupa icon/splash/adaptive/favicon

Generated debug files, private images, and `.superpowers/` brainstorming artifacts do not belong in git.

## Brand Contract

Use `Rupa` as the app name everywhere, including Korean UI copy. Do not use `루파`, `NEXT MOVE`, `Next Move`, or `next-move` for user-visible product identity after this pass.

The visual direction is the minimal rebrand option:

- Preserve the current app layout and navigation structure.
- Keep the app tool-like and focused on route simulation.
- Use the Rupa app icon and basic Rupa palette cues.
- Do not turn the home screen into a mascot-led redesign yet.
- Do not add new onboarding, mascot dialogue, or tutorial behavior.

Rupa palette cues should be derived from the existing `assets/rupa_theme/` direction:

- warm ivory background
- deep brown or near-black text
- strong warm primary action color for continuity
- restrained teal as an optional Rupa accent, especially where it already fits route or hold affordances

Prefer a small shared theme module over continuing to scatter new brand colors through components.

## Interface Contract

Expo metadata should use Rupa identity:

- `expo.name`: `Rupa`
- `expo.slug`: `rupa`
- `expo.scheme`: `rupa`
- `expo.icon`: Rupa icon asset
- iOS `bundleIdentifier`: `com.balancinglife.rupa`
- splash/adaptive/favicon should point to Rupa-compatible assets

No API request or response shapes should change. In particular:

- Expo route detection payloads stay unchanged.
- Nest wall analysis routes stay unchanged.
- FastAPI vision schemas stay unchanged.
- Environment variable names stay unchanged unless they explicitly encode the old product brand and are mobile-only.

Persisted local storage keys should use the Rupa brand. Existing local body profile data can reset during this rebrand.

## UX Contract

The first screen should show `Rupa` as the brand but keep the existing home screen structure. CTA labels and workflow copy can stay functionally similar unless they mention the old brand.

Headers in simulation and settings should show `Rupa`. Developer-only or lab-only labels can remain descriptive, but should not expose `Next Move`.

Korean copy should stay natural and concise. Avoid mixing English except for the brand name `Rupa` and existing technical/product terms.

## Verification Contract

Run the narrowest checks that prove the change:

```bash
npx tsc --noEmit
```

Also inspect remaining old-brand references:

```bash
rg -n "Next Move|NEXT MOVE|next-move|루파" app src docs package.json app.json
```

If the visual surface changes beyond text/color/icon wiring, start the app and inspect the affected mobile screens:

```bash
npx expo start --dev-client --host lan
```

When testing on a physical phone, `EXPO_PUBLIC_WALL_API_URL` must point to the Mac's LAN IP, not `localhost`.
