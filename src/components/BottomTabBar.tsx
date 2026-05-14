import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { brand } from "../theme/brand";

type BottomTabBarProps = {
  active: "simulation" | "settings";
};

export function BottomTabBar({ active }: BottomTabBarProps) {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabRow}>
        <Pressable
          accessibilityLabel="시뮬레이션 화면"
          onPress={() => router.replace("/(tabs)/simulation")}
          style={[styles.tab, active === "simulation" && styles.tabActive]}
        >
          <MaterialCommunityIcons
            color={
              active === "simulation"
                ? brand.colors.text
                : brand.colors.inactive
            }
            name="source-branch"
            size={24}
          />
          <Text
            style={[styles.label, active === "simulation" && styles.labelActive]}
          >
            시뮬레이션
          </Text>
          <View
            style={[
              styles.activeMarker,
              active === "simulation" ? styles.activeMarkerVisible : null,
            ]}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="설정 화면"
          onPress={() => router.replace("/(tabs)/settings")}
          style={[styles.tab, active === "settings" && styles.tabActive]}
        >
          <Ionicons
            color={
              active === "settings"
                ? brand.colors.text
                : brand.colors.inactive
            }
            name={active === "settings" ? "settings" : "settings-outline"}
            size={24}
          />
          <Text
            style={[styles.label, active === "settings" && styles.labelActive]}
          >
            설정
          </Text>
          <View
            style={[
              styles.activeMarker,
              active === "settings" ? styles.activeMarkerVisible : null,
            ]}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: "rgba(37, 29, 21, 0.1)",
    backgroundColor: brand.colors.chrome,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 18,
    gap: 36,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minWidth: 104,
    paddingTop: 8,
    paddingBottom: 4,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "rgba(254, 214, 96, 0.16)",
  },
  label: {
    color: brand.colors.inactive,
    fontSize: 12,
    fontWeight: "600",
  },
  labelActive: {
    color: brand.colors.text,
    fontWeight: "800",
  },
  activeMarker: {
    width: 22,
    height: 3,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  activeMarkerVisible: {
    backgroundColor: brand.colors.primary,
  },
});
