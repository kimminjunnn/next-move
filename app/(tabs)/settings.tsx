import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../src/components/AppHeader";
import { BottomTabBar } from "../../src/components/BottomTabBar";
import { ConfirmModal } from "../../src/components/ConfirmModal";
import { SimulationBackground } from "../../src/components/SimulationBackground";
import { useBodyProfileStore } from "../../src/store/useBodyProfileStore";

function toDisplayNumber(value: number) {
  return String(value);
}

function parsePositiveNumber(value: string, fallback: number) {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useBodyProfileStore();
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <SimulationBackground />
        <AppHeader showDivider={false} title="Next Move" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons color="#7a1f12" name="body-outline" size={16} />
              <Text style={styles.heroBadgeText}>BODY PROFILE</Text>
            </View>

            <Text style={styles.heroTitle}>신체 정보 설정</Text>
            <Text style={styles.heroBody}>
              시뮬레이션에서 동작 범위와 리치를 계산할 때 사용하는 기준이에요.
            </Text>
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.fieldHeaderRow}>
              <View style={styles.fieldHeaderCopy}>
                <Text style={styles.label}>키</Text>
                <Text style={styles.fieldBody}>
                  시뮬레이션에서 거리를 계산할 때 사용돼요.
                </Text>
              </View>

              <View style={styles.metricIconBox}>
                <Ionicons color="#262626" name="resize-outline" size={22} />
              </View>
            </View>

            <View style={styles.inputShell}>
              <TextInput
                keyboardType="numeric"
                onChangeText={(text) =>
                  updateProfile({
                    height: parsePositiveNumber(text, profile.height),
                  })
                }
                style={styles.input}
                value={toDisplayNumber(profile.height)}
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>

            <Text style={styles.helper}>시뮬레이션 거리 계산의 기준값</Text>
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.fieldHeaderRow}>
              <View style={styles.fieldHeaderCopy}>
                <Text style={styles.label}>리치</Text>
                <Text style={styles.fieldBody}>
                  양팔을 벌렸을 때의 길이예요.
                </Text>
              </View>

              <View
                style={[
                  styles.modeBadge,
                  profile.wingspanMode === "auto"
                    ? styles.modeBadgeAuto
                    : styles.modeBadgeCustom,
                ]}
              >
                <Text
                  style={[
                    styles.modeBadgeText,
                    profile.wingspanMode === "auto"
                      ? styles.modeBadgeTextAuto
                      : styles.modeBadgeTextCustom,
                  ]}
                >
                  {profile.wingspanMode === "auto" ? "자동" : "커스텀"}
                </Text>
              </View>
            </View>

            <View style={styles.inputShell}>
              <TextInput
                keyboardType="numeric"
                onChangeText={(text) =>
                  updateProfile({
                    wingspan: parsePositiveNumber(text, profile.wingspan),
                  })
                }
                style={styles.input}
                value={toDisplayNumber(profile.wingspan)}
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>

            <View style={styles.fieldFooterRow}>
              <Text style={styles.helper}>
                현재 모드:{" "}
                {profile.wingspanMode === "auto" ? "자동 계산" : "직접 입력"}
              </Text>

              <Pressable
                onPress={() => updateProfile({ wingspanMode: "auto" })}
                style={styles.inlineAction}
              >
                <Ionicons color="#8f0000" name="refresh" size={14} />
                <Text style={styles.inlineActionText}>자동 계산 복원</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footerCard}>
            <View style={styles.footerCopy}>
              <Text style={styles.footerBody}>
                입력한 기준이 시뮬레이션 화면에 바로 반영돼요.
              </Text>
            </View>

            <Pressable
              onPress={() => setConfirmVisible(true)}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
              <Ionicons color="#fffdf8" name="arrow-forward" size={24} />
            </Pressable>
          </View>
        </ScrollView>

        <BottomTabBar active="settings" />

        <ConfirmModal
          body="입력한 키와 리치를 내 체형 정보로 저장해요."
          confirmLabel="저장"
          onCancel={() => setConfirmVisible(false)}
          onConfirm={() => {
            setConfirmVisible(false);
            router.replace("/(tabs)/simulation");
          }}
          onRequestClose={() => setConfirmVisible(false)}
          title="이 정보로 저장할까요?"
          visible={confirmVisible}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f3eb",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f8f3eb",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 108,
    gap: 18,
  },
  heroCard: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#efe6d8",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    shadowColor: "#cbbda6",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 4,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f4eadf",
  },
  heroBadgeText: {
    color: "#7a1f12",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  heroTitle: {
    marginTop: 22,
    color: "#171717",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.9,
  },
  heroBody: {
    marginTop: 12,
    color: "#4f4f4f",
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "500",
  },
  fieldCard: {
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e9e2d7",
    backgroundColor: "rgba(244, 239, 230, 0.94)",
  },
  fieldHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  fieldHeaderCopy: {
    flex: 1,
    gap: 8,
  },
  label: {
    color: "#1e1e1e",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  fieldBody: {
    color: "#525252",
    fontSize: 14,
    lineHeight: 21,
  },
  metricIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ece3d6",
  },
  modeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modeBadgeAuto: {
    backgroundColor: "#f1e7d9",
  },
  modeBadgeCustom: {
    backgroundColor: "#e9ddd1",
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  modeBadgeTextAuto: {
    color: "#8f0000",
  },
  modeBadgeTextCustom: {
    color: "#5b4636",
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#ddd4c5",
    backgroundColor: "#f8f3eb",
  },
  input: {
    flex: 1,
    color: "#161616",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  inputUnit: {
    color: "#7b7468",
    fontSize: 16,
    fontWeight: "700",
  },
  helper: {
    flex: 1,
    color: "#6b6b6b",
    fontSize: 13,
    lineHeight: 19,
  },
  fieldFooterRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f8f1e7",
  },
  inlineActionText: {
    color: "#8f0000",
    fontSize: 13,
    fontWeight: "800",
  },
  footerCard: {
    gap: 18,
  },
  footerCopy: {
    gap: 8,
    paddingHorizontal: 4,
  },
  footerTitle: {
    color: "#1a1a1a",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  footerBody: {
    color: "#5d5d5d",
    fontSize: 14,
    lineHeight: 21,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 84,
    borderRadius: 24,
    backgroundColor: "#8f0000",
    shadowColor: "#8f0000",
    shadowOpacity: 0.26,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 6,
  },
  confirmButtonText: {
    color: "#fffdf8",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
});
