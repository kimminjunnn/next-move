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
        </Pressable>

        <Pressable
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
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: "rgba(37, 29, 21, 0.12)",
    backgroundColor: brand.colors.chrome,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 48,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 120,
    paddingVertical: 10,
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: brand.colors.wallLight,
  },
  label: {
    color: brand.colors.inactive,
    fontSize: 12,
    fontWeight: "500",
  },
  labelActive: {
    color: brand.colors.text,
    fontWeight: "700",
  },
});
