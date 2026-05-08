import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";
import { SimulationBackground } from "./SimulationBackground";
import { brand } from "../theme/brand";

type SimulationInputStageProps = {
  onOpenCamera: () => void;
  onOpenLibrary: () => void;
};

export function SimulationInputStage({
  onOpenCamera,
  onOpenLibrary,
}: SimulationInputStageProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <SimulationBackground />
        <AppHeader showDivider={false} title={brand.name} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <Pressable onPress={onOpenCamera} style={styles.primaryCard}>
            <View style={styles.cameraIconBox}>
              <Ionicons color={brand.colors.primaryText} name="camera" size={54} />
            </View>

            <Text style={styles.primaryTitle}>벽 사진 촬영하기</Text>
            <Text style={styles.primaryBody}>
              촬영으로 새 시뮬레이션 시작하기
            </Text>
          </Pressable>

          <Pressable onPress={onOpenLibrary} style={styles.secondaryCard}>
            <View style={styles.secondaryIconBox}>
              <Ionicons color={brand.colors.surface} name="images-outline" size={34} />
            </View>

            <View style={styles.secondaryCopy}>
              <Text style={styles.secondaryTitle}>갤러리에서 불러오기</Text>
              <Text style={styles.secondaryBody}>기존 사진으로 시뮬레이션</Text>
            </View>

            <Ionicons color={brand.colors.accent} name="chevron-forward" size={30} />
          </Pressable>
        </ScrollView>

        <BottomTabBar active="simulation" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brand.colors.chrome,
  },
  screen: {
    flex: 1,
    backgroundColor: brand.colors.wall,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 140,
    gap: 18,
  },
  primaryCard: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 360,
    paddingHorizontal: 28,
    paddingVertical: 34,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: brand.colors.primary,
    backgroundColor: "rgba(255, 244, 215, 0.96)",
    shadowColor: brand.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 4,
  },
  cameraIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 184,
    height: 184,
    borderRadius: 30,
    backgroundColor: brand.colors.primary,
  },
  primaryTitle: {
    marginTop: 30,
    color: brand.colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.9,
    textAlign: "center",
  },
  primaryBody: {
    marginTop: 14,
    color: brand.colors.mutedText,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
  },
  secondaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 22,
    minHeight: 132,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: brand.colors.accent,
    backgroundColor: "rgba(220, 239, 240, 0.94)",
  },
  secondaryIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: brand.colors.accent,
  },
  secondaryCopy: {
    flex: 1,
    gap: 4,
  },
  secondaryTitle: {
    color: brand.colors.text,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  secondaryBody: {
    color: brand.colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
