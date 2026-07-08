# Hot Updater Console Design System

## 1. Atmosphere & Identity

A quiet operational console for release engineers. The surface should feel
direct, credential-aware, and production-safe. The signature is a restrained
access gate that gets out of the way once a session exists.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Surface/primary | --console-auth-surface | #f5f5f4 | #11100f | Auth page background |
| Surface/panel | --console-auth-panel | #ffffff | #1a1817 | Auth card and controls |
| Text/primary | --console-auth-text | #1c1917 | #fafaf9 | Labels and headings |
| Text/secondary | --console-auth-muted | #78716c | #a8a29e | Helper text |
| Border/default | --console-auth-border | #d6d3d1 | #44403c | Inputs and panels |
| Accent/primary | --console-auth-accent | #2563eb | #60a5fa | Primary actions and focus |
| Accent/hover | --console-auth-accent-hover | #1d4ed8 | #93c5fd | Primary action hover |
| Status/error | --console-auth-error | #dc2626 | #f87171 | Auth errors |

### Rules

- Accent is only interactive, never decorative.
- Auth surfaces use borders, not heavy shadows.
- Add semantic color tokens here before introducing new colors.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| H1 | 28px | 700 | 1.2 | 0 | Auth title |
| H2 | 20px | 600 | 1.35 | 0 | Form title |
| Body | 16px | 400 | 1.6 | 0 | Default text |
| Body/sm | 14px | 400 | 1.5 | 0 | Help and errors |
| Caption | 12px | 600 | 1.4 | 0.02em | Button metadata |

### Font Stack

- Primary: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
- Serif: not used

### Rules

- Keep auth copy short and operational.
- Body text never drops below 14px.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a base of 4px.

| Token | Value | Usage |
| --- | --- | --- |
| --space-1 | 4px | Tight inline spacing |
| --space-2 | 8px | Label to field |
| --space-3 | 12px | Compact padding |
| --space-4 | 16px | Form gaps |
| --space-6 | 24px | Panel padding |
| --space-8 | 32px | Auth card sections |

### Grid

- Max auth panel width: 420px
- Breakpoints: mobile first, single column

### Rules

- Auth layout must fit a 375px viewport without horizontal scroll.
- Console content remains owned by `@hot-updater/console`.

## 5. Components

### Auth Gate

- **Structure**: full viewport shell, centered panel, form, secondary mode switch
- **Variants**: sign in, create account, loading, authenticated
- **Spacing**: `--space-2`, `--space-4`, `--space-6`, `--space-8`
- **States**: default, hover, active, focus, disabled, loading, error
- **Accessibility**: labeled inputs, semantic form, visible focus outline
- **Motion**: none

### Session Bar

- **Structure**: fixed top-right compact region with email and sign-out button
- **Variants**: authenticated only
- **Spacing**: `--space-2`, `--space-3`
- **States**: default, hover, active, focus, disabled
- **Accessibility**: button label is visible text
- **Motion**: none

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | 120ms | ease-out | Button hover and active states |

### Rules

- No decorative motion in auth.
- Every interactive element has hover, active, and focus states.

## 7. Depth & Surface

### Strategy

Borders-only. The auth panel uses one border and a small tonal contrast with the
page background. No shadows are introduced for the auth surface.
