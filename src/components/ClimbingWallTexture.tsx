import { StyleSheet, View } from "react-native";

type DotPosition = {
  left: `${number}%`;
  top: `${number}%`;
};

const DOTS: DotPosition[] = Array.from({ length: 12 }).flatMap((_, row) =>
  Array.from({ length: 8 }).map((__, column) => {
    const leftJitter = row % 2 === 0 ? 0 : 5;
    const topJitter = column % 3 === 0 ? 1 : column % 3 === 1 ? -1 : 0;

    return {
      left: `${8 + column * 12 + leftJitter}%` as `${number}%`,
      top: `${5 + row * 8 + topJitter}%` as `${number}%`,
    };
  }),
);

export function ClimbingWallTexture() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DOTS.map((dot, index) => (
        <View key={`${dot.left}-${dot.top}-${index}`} style={[styles.dot, dot]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: "rgba(255, 244, 215, 0.26)",
    backgroundColor: "rgba(37, 29, 21, 0.5)",
  },
});
