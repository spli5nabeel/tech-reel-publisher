import { z } from "zod";

export const KineticSceneSchema = z.object({
  type: z.literal("kinetic"),
  durationInSeconds: z.number(),
  narration: z.string().default(""),
  title: z.string(),
  subtitle: z.string().default(""),
});

export const CodeSceneSchema = z.object({
  type: z.literal("code"),
  durationInSeconds: z.number(),
  narration: z.string().default(""),
  language: z.string(),
  code: z.string(),
});

export const UISceneSchema = z.object({
  type: z.literal("ui"),
  durationInSeconds: z.number(),
  narration: z.string().default(""),
  appName: z.string(),
  steps: z.array(z.string()),
});

export const MascotSceneSchema = z.object({
  type: z.literal("mascot"),
  durationInSeconds: z.number(),
  narration: z.string().default(""),
  emotion: z.string(),
  message: z.string(),
});

export const SceneSchema = z.discriminatedUnion("type", [
  KineticSceneSchema,
  CodeSceneSchema,
  UISceneSchema,
  MascotSceneSchema,
]);

export const TipSchema = z.object({
  topic: z.string(),
  hook: z.string(),
  audio: z.string().nullable().default(null),
  scenes: z.array(SceneSchema),
});

export type KineticScene = z.infer<typeof KineticSceneSchema>;
export type CodeScene = z.infer<typeof CodeSceneSchema>;
export type UIScene = z.infer<typeof UISceneSchema>;
export type MascotScene = z.infer<typeof MascotSceneSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Tip = z.infer<typeof TipSchema>;
