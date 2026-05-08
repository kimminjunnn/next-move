import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { brand } from "../../src/theme/brand";
import { deriveWingspan, type WingspanMode } from "../../src/types/bodyProfile";

function toDisplayNumber(value: number) {
  return String(value);
}

function parsePositiveNumber(value: string) {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useBodyProfileStore();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [wingspanError, setWingspanError] = useState<string | null>(null);
  const [draftHeight, setDraftHeight] = useState(
    toDisplayNumber(profile.height),
  );
  const [draftWingspan, setDraftWingspan] = useState(
    toDisplayNumber(profile.wingspan),
  );
  const [draftWingspanMode, setDraftWingspanMode] = useState<WingspanMode>(
    profile.wingspanMode,
  );

  useEffect(() => {
    setDraftHeight(toDisplayNumber(profile.height));
    setDraftWingspan(toDisplayNumber(profile.wingspan));
    setDraftWingspanMode(profile.wingspanMode);
    setHeightError(null);
    setWingspanError(null);
  }, [profile.height, profile.wingspan, profile.wingspanMode]);

  function validateDraft() {
    const nextHeight = parsePositiveNumber(draftHeight);
    const nextWingspan = parsePositiveNumber(draftWingspan);
    const nextHeightError =
      nextHeight === null ? "키는 0보다 큰 숫자로 입력해 주세요." : null;
    const nextWingspanError =
      nextWingspan === null ? "리치는 0보다 큰 숫자로 입력해 주세요." : null;

    setHeightError(nextHeightError);
    setWingspanError(nextWingspanError);

    return {
      height: nextHeight,
      heightError: nextHeightError,
      wingspan: nextWingspan,
      wingspanError: nextWingspanError,
    };
  }

  function handleHeightChange(text: string) {
    setDraftHeight(text);
    setHeightError(null);

    if (draftWingspanMode !== "auto") {
      return;
    }

    const nextHeight = parsePositiveNumber(text);

    if (nextHeight === null) {
      return;
    }

    setDraftWingspan(toDisplayNumber(deriveWingspan(nextHeight)));
  }

  function handleWingspanChange(text: string) {
    setDraftWingspan(text);
    setDraftWingspanMode("custom");
    setWingspanError(null);
  }

  function handleRestoreAuto() {
    const nextHeight = parsePositiveNumber(draftHeight) ?? profile.height;
    setDraftWingspanMode("auto");
    setDraftWingspan(toDisplayNumber(deriveWingspan(nextHeight)));
    setWingspanError(null);
  }

  function handleOpenConfirm() {
    const { heightError: nextHeightError, wingspanError: nextWingspanError } =
      validateDraft();

    if (nextHeightError || nextWingspanError) {
      setConfirmVisible(false);
      return;
    }

    setConfirmVisible(true);
  }

  function handleConfirmSave() {
    const {
      height,
      heightError: nextHeightError,
      wingspan,
      wingspanError: nextWingspanError,
    } = validateDraft();

    if (
      nextHeightError ||
      nextWingspanError ||
      height === null ||
      wingspan === null
    ) {
      return;
    }

    updateProfile({
      height,
      wingspan,
      wingspanMode: draftWingspanMode,
    });
    setConfirmVisible(false);
    router.replace("/(tabs)/simulation");
  }

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
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons color={brand.colors.primaryText} name="body-outline" size={16} />
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
                <Ionicons color={brand.colors.surface} name="resize-outline" size={22} />
              </View>
            </View>

            <View
              style={[
                styles.inputShell,
                heightError ? styles.inputShellInvalid : null,
              ]}
            >
              <TextInput
                keyboardType="numeric"
                onChangeText={handleHeightChange}
                style={styles.input}
                value={draftHeight}
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>

            <Text style={styles.helper}>시뮬레이션 거리 계산의 기준값</Text>
            {heightError ? (
              <Text style={styles.errorText}>{heightError}</Text>
            ) : null}
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
                  draftWingspanMode === "auto"
                    ? styles.modeBadgeAuto
                    : styles.modeBadgeCustom,
                ]}
              >
                <Text
                  style={[
                    styles.modeBadgeText,
                    draftWingspanMode === "auto"
                      ? styles.modeBadgeTextAuto
                      : styles.modeBadgeTextCustom,
                  ]}
                >
                  {draftWingspanMode === "auto" ? "자동" : "커스텀"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.inputShell,
                wingspanError ? styles.inputShellInvalid : null,
              ]}
            >
              <TextInput
                keyboardType="numeric"
                onChangeText={handleWingspanChange}
                style={styles.input}
                value={draftWingspan}
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>

            <View style={styles.fieldFooterRow}>
              <Text style={styles.helper}>
                현재 모드:{" "}
                {draftWingspanMode === "auto" ? "자동 계산" : "직접 입력"}
              </Text>

              <Pressable
                onPress={handleRestoreAuto}
                style={styles.inlineAction}
              >
                <Ionicons color={brand.colors.primaryText} name="refresh" size={14} />
                <Text style={styles.inlineActionText}>자동 계산 복원</Text>
              </Pressable>
            </View>
            {wingspanError ? (
              <Text style={styles.errorText}>{wingspanError}</Text>
            ) : null}
          </View>

          <View style={styles.footerCard}>
            <View style={styles.footerCopy}>
              <Text style={styles.footerBody}>
                저장한 기준이 시뮬레이션 화면에 반영돼요.
              </Text>
            </View>

            <Pressable onPress={handleOpenConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>확인</Text>
              <Ionicons color={brand.colors.primaryText} name="arrow-forward" size={24} />
            </Pressable>
          </View>
        </ScrollView>

        <BottomTabBar active="settings" />

        <ConfirmModal
          body="입력한 키와 리치를 내 체형 정보로 저장해요."
          confirmLabel="저장"
          onCancel={() => setConfirmVisible(false)}
          onConfirm={handleConfirmSave}
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
    paddingBottom: 108,
    gap: 18,
  },
  heroCard: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: brand.colors.primary,
    backgroundColor: "rgba(255, 244, 215, 0.96)",
    shadowColor: brand.colors.primary,
    shadowOpacity: 0.18,
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
    backgroundColor: brand.colors.primary,
  },
  heroBadgeText: {
    color: brand.colors.primaryText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  heroTitle: {
    marginTop: 22,
    color: brand.colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.9,
  },
  heroBody: {
    marginTop: 12,
    color: brand.colors.mutedText,
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
    borderColor: brand.colors.border,
    backgroundColor: "rgba(255, 244, 215, 0.94)",
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
    color: brand.colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  fieldBody: {
    color: brand.colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },
  metricIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: brand.colors.accent,
  },
  modeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modeBadgeAuto: {
    backgroundColor: brand.colors.primary,
  },
  modeBadgeCustom: {
    backgroundColor: brand.colors.surfaceWarm,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  modeBadgeTextAuto: {
    color: brand.colors.primaryText,
  },
  modeBadgeTextCustom: {
    color: brand.colors.mutedText,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: brand.colors.border,
    backgroundColor: brand.colors.background,
  },
  inputShellInvalid: {
    borderColor: brand.colors.danger,
    backgroundColor: brand.colors.dangerSoft,
  },
  input: {
    flex: 1,
    color: brand.colors.text,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  inputUnit: {
    color: brand.colors.inactive,
    fontSize: 16,
    fontWeight: "700",
  },
  helper: {
    flex: 1,
    color: brand.colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: brand.colors.danger,
    fontSize: 13,
    fontWeight: "700",
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
    backgroundColor: brand.colors.primary,
  },
  inlineActionText: {
    color: brand.colors.primaryText,
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
    color: brand.colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  footerBody: {
    color: brand.colors.mutedText,
    fontSize: 14,
    lineHeight: 21,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 62,
    borderRadius: 24,
    backgroundColor: brand.colors.primary,
    shadowColor: brand.colors.primary,
    shadowOpacity: 0.26,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 6,
  },
  confirmButtonText: {
    color: brand.colors.primaryText,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
});
