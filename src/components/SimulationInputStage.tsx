import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabBar } from "./BottomTabBar";
import { SimulationBackground } from "./SimulationBackground";
import { useBodyProfileStore } from "../store/useBodyProfileStore";
import { brand } from "../theme/brand";

type SimulationInputStageProps = {
  onOpenCamera: () => void;
  onOpenLibrary: () => void;
};

export function SimulationInputStage({
  onOpenCamera,
  onOpenLibrary,
}: SimulationInputStageProps) {
  const router = useRouter();
  const { hasBodyProfile, profile } = useBodyProfileStore();
  const profileLabel = hasBodyProfile ? "현재 신체 정보" : "신체 정보 입력 필요";
  const profileSummary = hasBodyProfile
    ? `${profile.height}cm / 리치 ${profile.wingspan}cm`
    : "시뮬레이션 정확도를 위해 먼저 입력해 주세요";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <SimulationBackground />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Rupa</Text>
            <Text style={styles.heroTitle}>새 시뮬레이션</Text>
            <Text style={styles.heroBody}>
              벽 사진을 넣고 다음 움직임을 바로 맞춰보세요.
            </Text>
          </View>

          <Pressable onPress={onOpenCamera} style={styles.primaryCard}>
            <View style={styles.cameraIconBox}>
              <Ionicons color={brand.colors.primaryText} name="camera" size={48} />
            </View>

            <Text style={styles.primaryTitle}>벽 사진 촬영하기</Text>
            <Text style={styles.primaryBody}>
              촬영으로 새 시뮬레이션 시작하기
            </Text>
          </Pressable>

          <Pressable onPress={onOpenLibrary} style={styles.secondaryCard}>
            <View style={styles.secondaryIconBox}>
              <Ionicons color={brand.colors.primaryText} name="images-outline" size={34} />
            </View>

            <View style={styles.secondaryCopy}>
              <Text style={styles.secondaryTitle}>갤러리에서 불러오기</Text>
              <Text style={styles.secondaryBody}>기존 사진으로 시뮬레이션</Text>
            </View>

            <Ionicons color={brand.colors.text} name="chevron-forward" size={30} />
          </Pressable>

          <Pressable
            accessibilityLabel="신체 정보 설정으로 이동"
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/settings")}
            style={[
              styles.profileStrip,
              !hasBodyProfile && styles.profileStripRequired,
            ]}
          >
            <View style={styles.profileIconBox}>
              <Ionicons
                color={brand.colors.primaryText}
                name={hasBodyProfile ? "body-outline" : "sparkles"}
                size={22}
              />
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileLabel}>{profileLabel}</Text>
              <Text style={styles.profileValue}>{profileSummary}</Text>
            </View>
            <Text
              style={[
                styles.profileMode,
                !hasBodyProfile && styles.profileModeRequired,
              ]}
            >
              {hasBodyProfile ? "수정" : "입력하기"}
            </Text>
            <Ionicons
              color={brand.colors.mutedText}
              name="chevron-forward"
              size={20}
            />
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
    backgroundColor: brand.colors.wall,
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
    paddingTop: 24,
    paddingBottom: 140,
    gap: 16,
  },
  heroCopy: {
    gap: 7,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  heroEyebrow: {
    color: brand.colors.inactive,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: brand.colors.text,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  heroBody: {
    color: brand.colors.mutedText,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  primaryCard: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    paddingHorizontal: 28,
    paddingVertical: 30,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(37, 29, 21, 0.1)",
    backgroundColor: "rgba(255, 248, 231, 0.92)",
    shadowColor: brand.colors.text,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  cameraIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 132,
    height: 132,
    borderRadius: 28,
    backgroundColor: brand.colors.primary,
  },
  primaryTitle: {
    marginTop: 24,
    color: brand.colors.text,
    fontSize: 29,
    fontWeight: "800",
    lineHeight: 35,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  primaryBody: {
    marginTop: 10,
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
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: brand.colors.border,
    backgroundColor: "rgba(255, 248, 231, 0.9)",
  },
  secondaryIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: brand.colors.primarySoft,
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
  profileStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 78,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(37, 29, 21, 0.1)",
    backgroundColor: "rgba(234, 212, 167, 0.52)",
  },
  profileStripRequired: {
    borderWidth: 2,
    borderColor: brand.colors.primary,
    backgroundColor: "rgba(254, 214, 96, 0.36)",
    shadowColor: brand.colors.primary,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
  },
  profileIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: brand.colors.primarySoft,
  },
  profileCopy: {
    flex: 1,
    gap: 3,
  },
  profileLabel: {
    color: brand.colors.inactive,
    fontSize: 12,
    fontWeight: "800",
  },
  profileValue: {
    color: brand.colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  profileMode: {
    color: brand.colors.mutedText,
    fontSize: 12,
    fontWeight: "800",
  },
  profileModeRequired: {
    color: brand.colors.primaryText,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: brand.colors.primary,
  },
});
