import { Image, StyleSheet, View } from "react-native";

import type { ComputedCharacterPartTransform } from "../types/characterRig";

type RiggedImagePartProps = {
  part: ComputedCharacterPartTransform;
};

export function RiggedImagePart({ part }: RiggedImagePartProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.part,
        {
          height: part.height,
          left: part.center.x - part.width / 2,
          opacity: part.opacity,
          top: part.center.y - part.height / 2,
          transform: [{ rotate: `${part.rotationDeg}deg` }],
          width: part.width,
          zIndex: part.zIndex,
        },
      ]}
    >
      <Image resizeMode="contain" source={part.source} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: "100%",
    width: "100%",
  },
  part: {
    position: "absolute",
  },
});
