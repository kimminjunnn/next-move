export type WingspanMode = "auto" | "custom";

export type BodyProfile = {
  height: number;
  wingspan: number;
  wingspanMode: WingspanMode;
};

export const DEFAULT_HEIGHT = 170;

export function deriveWingspan(height: number) {
  return Math.round(height * 1.01);
}

export const DEFAULT_BODY_PROFILE: BodyProfile = {
  height: DEFAULT_HEIGHT,
  wingspan: deriveWingspan(DEFAULT_HEIGHT),
  wingspanMode: "auto",
};
