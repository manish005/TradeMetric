import { type Variants } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const springSoft = { type: "spring", stiffness: 320, damping: 28 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE, delay: i * 0.07 },
  }),
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26, delay: i * 0.06 },
  }),
};

export const panelTransition = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.985 },
  transition: { duration: 0.32, ease: EASE },
} as const;