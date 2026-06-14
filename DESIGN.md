# SpeakType — Design System

A **Material Design 3 (Material You)** system — the Google look the owner likes — applied
to both the extension UI and the dashboard. This file is the single source of truth for
visual decisions. Components and pages must follow it (per AGENTS.md).

> Implementation: tokens below become CSS custom properties shared between
> `apps/extension/styles` and the dashboard. Keep the extension bundle small — prefer the
> hand-rolled tokens here over a heavy component library inside the content script.

---

## 1. Principles
1. **Calm, not flashy.** The extension lives on other people's pages — it must never shout.
2. **Friendly & intimate.** The mic icon should feel like a kind little companion the user is
   fond of and wants to come back to (see §6).
3. **Material You.** Rounded shapes, soft elevation, Google color roles, Roboto type, gentle motion.
4. **Accessible.** WCAG AA contrast, focus rings, reduced-motion support, keyboard reachable.

---

## 2. Color (MD3 roles)
Seed = Google blue. Expressed as CSS variables; both light and dark.

```css
:root {
  /* Primary */
  --st-primary:        #4285F4; /* Google blue */
  --st-on-primary:     #FFFFFF;
  --st-primary-container: #D7E3FF;
  --st-on-primary-container: #001A41;

  /* Secondary / accents (Google palette) */
  --st-secondary:      #34A853; /* green  */
  --st-tertiary:       #FBBC05; /* yellow */
  --st-error:          #EA4335; /* red    */
  --st-on-error:       #FFFFFF;

  /* Surfaces */
  --st-surface:        #FDFCFF;
  --st-on-surface:     #1A1C1E;
  --st-surface-variant:#E1E2EC;
  --st-on-surface-variant:#44474E;
  --st-outline:        #74777F;

  /* Scrim / shadow */
  --st-scrim:          rgba(0,0,0,.32);
}

:root[data-theme="dark"] {
  --st-primary:        #A8C7FA;
  --st-on-primary:     #00315C;
  --st-primary-container:#194A7A;
  --st-on-primary-container:#D7E3FF;
  --st-surface:        #1A1C1E;
  --st-on-surface:     #E3E2E6;
  --st-surface-variant:#44474E;
  --st-on-surface-variant:#C4C6D0;
  --st-outline:        #8E9099;
}
```

---

## 3. Typography
- Family: `Roboto, "Google Sans", system-ui, sans-serif`.
- MD3 scale (key roles): Display L 57, Headline M 28, Title L 22, **Body L 16 / Body M 14**,
  Label L 14 / Label M 12. Line-height ≈ 1.4 for body.

---

## 4. Shape, spacing, elevation
- **Spacing scale (px):** 4 · 8 · 12 · 16 · 24 · 32.
- **Radius:** sm 8 · md 12 · lg 20 · **full 999** (the mic uses `full`).
- **Elevation:** soft, blue-tinted shadows.
  - `--st-elev-1: 0 1px 2px rgba(60,64,67,.30), 0 1px 3px rgba(60,64,67,.15);`
  - `--st-elev-2: 0 2px 6px rgba(60,64,67,.30), 0 1px 2px rgba(60,64,67,.15);`

---

## 5. Motion
```css
:root {
  --st-ease-standard: cubic-bezier(.2,0,0,1);
  --st-ease-emphasized: cubic-bezier(.2,0,0,1);
  --st-dur-short: 150ms;
  --st-dur-medium: 250ms;
  --st-dur-long: 400ms;
}
@media (prefers-reduced-motion: reduce) { /* disable breathing/float, keep opacity only */ }
```
- Icons: Material Symbols (Rounded).

---

## 6. The mic icon — the emotional centerpiece

A small, friendly companion injected near the focused field, inside a **Shadow DOM** so the
host page can never restyle it and it can never break the host's layout.

### Shape & feel
- A **round, pill/blob** mic button, radius `full`, ~36–40px, soft `--st-elev-2`.
- Warm and rounded — not a hard square. Slight inner highlight so it feels "alive."
- Positioned just inside/near the field's trailing edge; offset so it never covers text.

### States (the personality)
| State | Look | Motion |
|---|---|---|
| **Idle** | small, ~70% opacity, calm primary tint | none |
| **Appear** (on focus) | fades to full opacity | gentle fade + tiny upward float (`--st-dur-medium`) |
| **Hover** | soft scale 1.06, warm shadow, quota tooltip | `--st-ease-standard` |
| **Recording** | filled primary, mic glyph | slow **breathing** pulse (scale 1.0↔1.06, ~2s loop) — alive, never aggressive |
| **Uploading** | subtle indeterminate ring | calm spin |
| **Success** | brief check, secondary green | quick, then back to idle |
| **Error/offline** | error tint + "tap to retry" | static, no alarm |
| **Disappear** (on blur) | fade out + settle down | `--st-dur-short` |

### The intent
Low-key presence → quiet fade-in → a soft "breathing" while listening. The result should
leave a little warmth: the kind of detail that makes someone *want* to dictate again. Cute,
but it always yields to the user's writing — never distracting.

### Accessibility & activation
- `role="button"`, `aria-label="Dictate with SpeakType"`, focus ring, keyboard-activatable.
- Respect `prefers-reduced-motion` (drop the float/breathing, keep opacity changes).
- **Two ways to trigger, one visual state:** mouse click on the icon **or** the keyboard
  toggle (`Alt+Shift+W` Win/Linux · `Ctrl+Shift+W` Mac, rebindable). The keyboard toggle drives
  the exact same idle→recording→idle states, so the icon always reflects what's happening even
  when the user never touched the mouse.

---

## 7. Other UI surfaces
- **Inline preview** (when `requireConfirmation` on): small card, `--st-elev-2`, radius md,
  with Accept (primary) / Reject (text) / Edit (tonal). Appears near the field, never modal.
- **Quota badge / tooltip:** Label M text, surface-variant background.
- **Permission-denied help panel:** calm card with the re-enable steps; error tint only on the icon.
- **Popup & dashboard:** standard MD3 — top bar, cards, tonal buttons, the type scale above.

---

## 8. Do / Don't
- ✅ Soft, rounded, calm, Google-tinted, accessible, reduced-motion aware.
- ❌ No harsh edges, no loud/looping animation, no covering the user's text, no host-page CSS leakage.
