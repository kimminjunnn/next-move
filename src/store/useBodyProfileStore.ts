import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  DEFAULT_BODY_PROFILE,
  deriveWingspan,
  type BodyProfile,
} from "../types/bodyProfile";

type BodyProfilePatch = Partial<BodyProfile>;

type BodyProfileStore = {
  profile: BodyProfile;
  updateProfile: (patch: BodyProfilePatch) => void;
};

function resolveProfilePatch(
  current: BodyProfile,
  patch: BodyProfilePatch,
): BodyProfile {
  const next = {
    ...current,
    ...patch,
  };

  if (patch.wingspan !== undefined && patch.wingspan !== current.wingspan) {
    next.wingspanMode = "custom";
  }

  if (patch.height !== undefined && current.wingspanMode === "auto") {
    next.wingspan = deriveWingspan(patch.height);
  }

  if (patch.wingspanMode === "auto") {
    next.wingspan = deriveWingspan(next.height);
  }

  return next;
}

export const useBodyProfileStore = create<BodyProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_BODY_PROFILE,
      updateProfile: (patch) =>
        set((state) => ({
          profile: resolveProfilePatch(state.profile, patch),
        })),
    }),
    {
      name: "rupa-body-profile",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
