import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBodyProfileStore } from "../store/useBodyProfileStore";

type ProfileDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

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

export function ProfileDrawer({ visible, onClose }: ProfileDrawerProps) {
  const { profile, updateProfile } = useBodyProfileStore();

  return (
    <Modal
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <SafeAreaView style={styles.drawerSafeArea}>
          <View style={styles.drawer}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>내 프로필</Text>
                <Text style={styles.subtitle}>
                  키를 바꾸면 리치는 자동 계산됩니다. 직접 수정하면 커스텀으로
                  유지됩니다.
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>닫기</Text>
              </Pressable>
            </View>

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

            <Pressable onPress={onClose} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>확인</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(2, 6, 23, 0.4)",
  },
  backdrop: {
    flex: 1,
  },
  drawerSafeArea: {
    width: "86%",
    maxWidth: 420,
    backgroundColor: "#0f172a",
  },
  drawer: {
    flex: 1,
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#1e293b",
  },
  closeText: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700",
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111827",
    color: "#f8fafc",
    fontSize: 16,
  },
  helper: {
    color: "#64748b",
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
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "700",
  },
  confirmButton: {
    marginTop: "auto",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#f43f5e",
  },
  confirmButtonText: {
    color: "#fff1f2",
    fontSize: 14,
    fontWeight: "800",
  },
});
