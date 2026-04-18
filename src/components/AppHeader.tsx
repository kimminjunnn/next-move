import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

type AppHeaderProps = {
  showDivider?: boolean;
  title: string;
};

export function AppHeader({ title, showDivider = true }: AppHeaderProps) {
  return (
    <View style={[styles.header, !showDivider && styles.headerWithoutDivider]}>
      <Pressable
        accessibilityLabel="메뉴"
        onPress={() => Alert.alert("준비 중", "메뉴는 다음 단계에서 연결됩니다.")}
        style={styles.iconButton}
      >
        <Ionicons color="#4b5563" name="menu" size={28} />
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.rightSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ebe4d8",
    backgroundColor: "#f8f3eb",
  },
  headerWithoutDivider: {
    borderBottomWidth: 0,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  title: {
    color: "#111111",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  rightSpacer: {
    width: 40,
    height: 40,
  },
});
