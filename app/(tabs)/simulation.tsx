import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../src/components/AppHeader";
import { BottomTabBar } from "../../src/components/BottomTabBar";

export default function SimulationScreen() {
  async function handlePickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("권한 필요", "갤러리 사진을 불러오려면 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      Alert.alert("사진 선택 완료", "선택한 벽 사진으로 다음 단계를 이어갈 수 있어요.");
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("권한 필요", "카메라를 사용하려면 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      Alert.alert("사진 촬영 완료", "촬영한 벽 사진으로 다음 단계를 이어갈 수 있어요.");
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppHeader title="NEXT MOVE" />

        <View style={styles.content}>
          <Pressable onPress={() => void handleTakePhoto()} style={styles.primaryCard}>
            <View style={styles.cameraIconBox}>
              <Ionicons color="#151515" name="camera" size={66} />
            </View>

            <Text style={styles.primaryTitle}>벽 사진 촬영하기</Text>
            <Text style={styles.primaryBody}>벽 사진으로 새 시뮬레이션 시작</Text>
          </Pressable>

          <Pressable onPress={() => void handlePickFromLibrary()} style={styles.secondaryCard}>
            <View style={styles.secondaryIconBox}>
              <Ionicons color="#545454" name="images-outline" size={40} />
            </View>

            <View style={styles.secondaryCopy}>
              <Text style={styles.secondaryTitle}>갤러리에서 불러오기</Text>
              <Text style={styles.secondaryBody}>기존 사진으로 시뮬레이션</Text>
            </View>

            <Ionicons color="#6d6d6d" name="chevron-forward" size={32} />
          </Pressable>
        </View>

        <BottomTabBar active="simulation" />
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
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 24,
    gap: 26,
  },
  primaryCard: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 470,
    paddingHorizontal: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#efe6d8",
    backgroundColor: "#ffffff",
    shadowColor: "#cbbda6",
    shadowOpacity: 0.16,
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
    width: 232,
    height: 232,
    borderRadius: 24,
    backgroundColor: "#e7e2d9",
  },
  primaryTitle: {
    marginTop: 44,
    color: "#111111",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -1,
    textAlign: "center",
  },
  primaryBody: {
    marginTop: 18,
    color: "#383838",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    textAlign: "center",
  },
  secondaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    paddingHorizontal: 26,
    minHeight: 178,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#e9e2d7",
    backgroundColor: "#f4efe6",
  },
  secondaryIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 86,
    height: 86,
    backgroundColor: "#e7e2d9",
  },
  secondaryCopy: {
    flex: 1,
    gap: 6,
  },
  secondaryTitle: {
    color: "#111111",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  secondaryBody: {
    color: "#444444",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
});
