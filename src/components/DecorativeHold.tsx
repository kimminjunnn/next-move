import { StyleProp, ViewStyle } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";

type DecorativeHoldProps = {
  color: string;
  highlight: string;
  style?: StyleProp<ViewStyle>;
  variant?: "jug" | "pinch" | "sloper" | "crimp" | "pocket";
};

function getHoldPath(variant: DecorativeHoldProps["variant"]) {
  switch (variant) {
    case "crimp":
      return "M16 57c2-11 11-19 22-24 16-8 36-12 53-6 12 4 20 16 18 28-2 12-12 20-23 24-11 5-24 8-37 9-12 1-25-1-32-10-5-5-6-12-1-21Z";
    case "pocket":
      return "M18 49c3-16 16-28 31-34 19-7 42-7 58 4 12 8 16 24 12 38-4 15-16 27-31 33-16 7-36 7-51-1-15-8-23-24-19-40Z";
    case "pinch":
      return "M17 50C19 28 34 16 56 13c17-2 35 3 42 17 8 15 2 31-7 41-10 10-20 18-34 20-24 4-48-13-57-34-2-5-2-10 0-17Z";
    case "sloper":
      return "M20 45c4-18 18-29 35-33 20-4 44 1 55 17 8 12 7 30-4 41-12 13-30 18-48 19-16 1-35-4-44-18-4-6-5-14-2-26Z";
    case "jug":
    default:
      return "M15 43c2-15 11-29 27-35 17-7 39-7 53 3 13 10 18 29 11 44-8 16-26 26-45 29-18 3-38-2-48-17-4-6-5-14-3-24Z";
  }
}

function getHighlightPath(variant: DecorativeHoldProps["variant"]) {
  switch (variant) {
    case "crimp":
      return "M27 46c8-6 19-10 31-12 10-1 19 0 28 4-8 2-16 4-23 8-7 3-13 7-19 13-8 0-14-3-17-13Z";
    case "pocket":
      return "M29 35c8-9 20-14 32-14 9 0 19 3 26 9-10 0-19 4-27 9-5 4-10 9-14 15-8-2-13-7-17-19Z";
    case "pinch":
      return "M30 39c4-8 12-14 21-17 9-3 20-2 28 3-9 2-16 6-22 11-4 4-7 8-10 13-6 0-12-3-17-10Z";
    case "sloper":
      return "M28 37c7-10 18-15 30-17 12-1 22 2 30 8-10 0-20 3-28 8-5 3-10 8-14 13-8-1-14-5-18-12Z";
    case "jug":
    default:
      return "M27 36c7-9 18-14 30-15 10-1 21 2 28 8-10 1-18 5-25 10-5 4-8 9-11 14-8-1-15-6-22-17Z";
  }
}

function getShadowShape(variant: DecorativeHoldProps["variant"]) {
  switch (variant) {
    case "crimp":
      return <Ellipse cx="66" cy="72" rx="20" ry="8" fill="#00000018" />;
    case "pocket":
      return (
        <>
          <Ellipse cx="49" cy="63" rx="9" ry="11" fill="#00000028" />
          <Ellipse cx="69" cy="67" rx="8" ry="10" fill="#00000024" />
        </>
      );
    default:
      return <Ellipse cx="63" cy="72" rx="18" ry="10" fill="#00000018" />;
  }
}

export function DecorativeHold({
  color,
  highlight,
  style,
  variant = "jug",
}: DecorativeHoldProps) {
  return (
    <Svg viewBox="0 0 110 110" style={style}>
      <Path d={getHoldPath(variant)} fill={color} />
      <Path d={getHighlightPath(variant)} fill={highlight} opacity={0.9} />
      {getShadowShape(variant)}
    </Svg>
  );
}
