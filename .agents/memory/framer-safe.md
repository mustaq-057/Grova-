---
name: Framer-motion safe patterns
description: How to use framer-motion safely in this project to avoid React context crashes
---

## Rule
Do NOT use `AnimatePresence` in this project — it caused "cannot read useContext" errors during HMR.

## Safe pattern
Use `motion.div` with conditional rendering (ternary or `&&`) instead of wrapping with `AnimatePresence`.

**Why:** There appears to be a React version / HMR interaction that breaks `AnimatePresence`'s internal context in this Vite setup.

## How to apply
- For enter animations: use `motion.div` with `initial`/`animate`.
- For slide-in panels: use `{showPanel && <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} ...>}`.
- For modals/overlays: same pattern — conditional render + initial/animate on the motion.div itself.
