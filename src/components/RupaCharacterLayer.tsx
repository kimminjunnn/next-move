import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import {
  computeCharacterPartTransforms,
  getRupaCharacterTransformOptions,
  RUPA_BACK_CHARACTER_PARTS,
} from "../lib/rupaCharacterRig";
import type {
  CharacterRigPart,
  CharacterRigTransformOptions,
} from "../types/characterRig";
import type { SkeletonBodyModel, SkeletonPose } from "../types/skeletonPose";
import { RiggedImagePart } from "./RiggedImagePart";

export type CharacterLayerProps = {
  bodyModel: SkeletonBodyModel;
  opacity?: number;
  parts: ReadonlyArray<CharacterRigPart>;
  pose: SkeletonPose;
  transformOptions?: CharacterRigTransformOptions;
  visible?: boolean;
};

export function CharacterLayer({
  bodyModel,
  opacity = 1,
  parts,
  pose,
  transformOptions,
  visible = true,
}: CharacterLayerProps) {
  const transforms = useMemo(
    () =>
      computeCharacterPartTransforms(
        [...parts],
        pose,
        bodyModel,
        transformOptions,
      ),
    [bodyModel, parts, pose, transformOptions],
  );

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.layer, { opacity }]}>
      {transforms.map((part) => (
        <RiggedImagePart key={part.id} part={part} />
      ))}
    </View>
  );
}

export type RupaCharacterLayerProps = Omit<CharacterLayerProps, "parts">;

export function RupaCharacterLayer({
  pose,
  transformOptions,
  ...props
}: RupaCharacterLayerProps) {
  return (
    <CharacterLayer
      {...props}
      parts={RUPA_BACK_CHARACTER_PARTS}
      pose={pose}
      transformOptions={
        transformOptions ?? getRupaCharacterTransformOptions(pose)
      }
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
