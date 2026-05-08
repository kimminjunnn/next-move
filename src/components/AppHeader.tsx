import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { brand } from "../theme/brand";

type AppHeaderProps = {
  showDivider?: boolean;
  title: string;
};

export function AppHeader({ title, showDivider = true }: AppHeaderProps) {
  return (
    <View style={[styles.header, !showDivider && styles.headerWithoutDivider]}>
      <Pressable
        accessibilityLabel="메뉴"
        onPress={() =>
          Alert.alert("준비 중", "메뉴는 다음 단계에서 연결됩니다.")
        }
        style={styles.iconButton}
      >
        <Ionicons color={brand.colors.text} name="menu" size={24} />
      </Pressable>

      <View style={styles.signPlate}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 84,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37, 29, 21, 0.12)",
    backgroundColor: brand.colors.chrome,
    overflow: "hidden",
  },
  headerWithoutDivider: {
    borderBottomWidth: 0,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  signPlate: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    maxWidth: 260,
    marginHorizontal: 10,
    paddingHorizontal: 36,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "rgba(255, 244, 215, 0.2)",
    backgroundColor: brand.colors.gymDark,
    shadowColor: brand.colors.text,
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },
  title: {
    color: brand.colors.surface,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: 0.2,
    lineHeight: 25,
    textTransform: "uppercase",
  },
  rightSpacer: {
    width: 40,
    height: 40,
  },
});
