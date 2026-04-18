import { useRouter } from "expo-router";
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

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppHeader showDivider={false} title="Next Move" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내 몸 기준 설정</Text>
            <Text style={styles.sectionBody}>
              키와 리치를 맞춰두면 시뮬레이션에서 내 동작 범위를 계산하는
              기준으로 사용합니다.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>키</Text>
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
              <Text style={styles.helper}>cm 기준</Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.inlineLabelRow}>
                <Text style={styles.label}>리치</Text>
                <Pressable
                  onPress={() => updateProfile({ wingspanMode: "auto" })}
                  style={styles.inlineAction}
                >
                  <Text style={styles.inlineActionText}>자동 계산 복원</Text>
                </Pressable>
              </View>
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
              <Text style={styles.helper}>
                현재 모드: {profile.wingspanMode === "auto" ? "자동" : "커스텀"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.replace("/(tabs)/simulation")}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonText}>확인</Text>
          </Pressable>
        </ScrollView>

        <BottomTabBar active="settings" />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 24,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: "#171717",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  sectionBody: {
    color: "#525252",
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    gap: 18,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8e0d3",
    backgroundColor: "#fffdf9",
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: "#2f2f2f",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd4c5",
    backgroundColor: "#f8f3eb",
    color: "#161616",
    fontSize: 16,
  },
  helper: {
    color: "#737373",
    fontSize: 12,
  },
  inlineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  inlineAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineActionText: {
    color: "#8f0000",
    fontSize: 12,
    fontWeight: "700",
  },
  confirmButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#8f0000",
  },
  confirmButtonText: {
    color: "#fffdf8",
    fontSize: 14,
    fontWeight: "800",
  },
});
