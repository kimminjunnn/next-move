import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
            color={active === "simulation" ? "#8f0000" : "#737373"}
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
            color={active === "settings" ? "#8f0000" : "#737373"}
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
    borderTopColor: "#ebe4d8",
    backgroundColor: "#f8f3eb",
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
    backgroundColor: "#f0e9de",
  },
  label: {
    color: "#737373",
    fontSize: 12,
    fontWeight: "500",
  },
  labelActive: {
    color: "#8f0000",
    fontWeight: "700",
  },
});
