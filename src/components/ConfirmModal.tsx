import { Modal, Pressable, StyleSheet, Text, View, type ModalProps } from "react-native";

import { brand } from "../theme/brand";

type ConfirmModalProps = {
  body: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
} & Pick<ModalProps, "onRequestClose">;

export function ConfirmModal({
  body,
  cancelLabel = "취소",
  confirmLabel = "확인",
  onCancel,
  onConfirm,
  onRequestClose,
  title,
  visible,
}: ConfirmModalProps) {
  return (
    <Modal
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable onPress={onCancel} style={styles.modalBackdrop} />

        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{body}</Text>

          <View style={styles.modalActionRow}>
            <Pressable
              onPress={onCancel}
              style={[styles.modalActionButton, styles.modalSecondaryButton]}
            >
              <Text
                style={[
                  styles.modalActionText,
                  styles.modalSecondaryButtonText,
                ]}
              >
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={[styles.modalActionButton, styles.modalPrimaryButton]}
            >
              <Text
                style={[
                  styles.modalActionText,
                  styles.modalPrimaryButtonText,
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(23, 23, 23, 0.32)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: brand.colors.border,
    backgroundColor: brand.colors.surface,
    shadowColor: brand.colors.text,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },
  modalTitle: {
    color: brand.colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  modalBody: {
    marginTop: 8,
    color: brand.colors.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    borderRadius: 18,
  },
  modalSecondaryButton: {
    borderWidth: 1,
    borderColor: brand.colors.border,
    backgroundColor: brand.colors.wallLight,
  },
  modalPrimaryButton: {
    backgroundColor: brand.colors.danger,
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalSecondaryButtonText: {
    color: brand.colors.text,
  },
  modalPrimaryButtonText: {
    color: brand.colors.primaryText,
  },
});
