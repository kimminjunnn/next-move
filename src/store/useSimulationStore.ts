import { create } from "zustand";

import type {
  SimulationMode,
  SimulationPhoto,
  SimulationPhotoTransform,
} from "../types/simulation";

type SimulationStore = {
  mode: SimulationMode;
  photo: SimulationPhoto | null;
  draftPhoto: SimulationPhoto | null;
  transform: SimulationPhotoTransform | null;
  setDraftPhoto: (photo: SimulationPhoto) => void;
  applyTransform: (transform: SimulationPhotoTransform) => void;
  cancelDraft: () => void;
  clearPhoto: () => void;
  setMode: (mode: SimulationMode) => void;
};

export const useSimulationStore = create<SimulationStore>()((set) => ({
  mode: "input",
  photo: null,
  draftPhoto: null,
  transform: null,
  setDraftPhoto: (draftPhoto) =>
    set({
      draftPhoto,
      mode: "adjust",
    }),
  applyTransform: (transform) =>
    set((state) => {
      if (!state.draftPhoto) {
        return state;
      }

      return {
        photo: state.draftPhoto,
        draftPhoto: null,
        transform,
        mode: "canvas",
      };
    }),
  cancelDraft: () =>
    set((state) => ({
      draftPhoto: null,
      mode: state.photo && state.transform ? "canvas" : "input",
    })),
  clearPhoto: () =>
    set({
      mode: "input",
      photo: null,
      draftPhoto: null,
      transform: null,
    }),
  setMode: (mode) => set({ mode }),
}));
