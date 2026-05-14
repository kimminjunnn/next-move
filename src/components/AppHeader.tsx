import { StyleSheet, Text, View } from "react-native";

import { brand } from "../theme/brand";

type AppHeaderProps = {
  showDivider?: boolean;
  title: string;
};

export function AppHeader({ title, showDivider = true }: AppHeaderProps) {
  return (
    <View style={[styles.header, !showDivider && styles.headerWithoutDivider]}>
      <View style={styles.sideSpacer} />

      <View style={styles.signPlate}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.sideSpacer} />
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
  sideSpacer: {
    width: 40,
    height: 40,
  },
});
