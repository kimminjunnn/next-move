import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../../src/components/AppHeader";
import { BottomTabBar } from "../../src/components/BottomTabBar";
import { SimulationBackground } from "../../src/components/SimulationBackground";

export default function SimulationScreen() {
  async function handlePickFromLibrary() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "권한 필요",
          "갤러리 사진을 불러오려면 접근 권한이 필요합니다.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      Alert.alert(
        "사진 선택 완료",
        "선택한 벽 사진으로 다음 단계를 이어갈 수 있어요.",
      );
    } catch {
      Alert.alert(
        "불러오기 실패",
        "사진 보관함을 여는 중 문제가 발생했습니다. 다시 시도해 주세요.",
      );
    }
  }

  async function handleTakePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("권한 필요", "카메라를 사용하려면 접근 권한이 필요합니다.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      Alert.alert(
        "사진 촬영 완료",
        "촬영한 벽 사진으로 다음 단계를 이어갈 수 있어요.",
      );
    } catch {
      Alert.alert(
        "카메라 사용 불가",
        "현재 환경에서는 카메라를 열 수 없습니다. 실제 기기에서 다시 시도해 주세요.",
      );
    }
  }

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
          <Pressable
            onPress={() => void handleTakePhoto()}
            style={styles.primaryCard}
          >
            <View style={styles.cameraIconBox}>
              <Ionicons color="#151515" name="camera" size={54} />
            </View>

            <Text style={styles.primaryTitle}>벽 사진 촬영하기</Text>
            <Text style={styles.primaryBody}>
              촬영으로 새 시뮬레이션 시작하기
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void handlePickFromLibrary()}
            style={styles.secondaryCard}
          >
            <View style={styles.secondaryIconBox}>
              <Ionicons color="#545454" name="images-outline" size={34} />
            </View>

            <View style={styles.secondaryCopy}>
              <Text style={styles.secondaryTitle}>갤러리에서 불러오기</Text>
              <Text style={styles.secondaryBody}>기존 사진으로 시뮬레이션</Text>
            </View>

            <Ionicons color="#6d6d6d" name="chevron-forward" size={30} />
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
    backgroundColor: "#f7f3eb",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f7f3eb",
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
  cameraIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 184,
    height: 184,
    borderRadius: 30,
    backgroundColor: "#e7e2d9",
  },
  primaryTitle: {
    marginTop: 30,
    color: "#111111",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.9,
    textAlign: "center",
  },
  primaryBody: {
    marginTop: 14,
    color: "#383838",
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
    borderColor: "#e9e2d7",
    backgroundColor: "rgba(244, 239, 230, 0.94)",
  },
  secondaryIconBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: "#e7e2d9",
  },
  secondaryCopy: {
    flex: 1,
    gap: 4,
  },
  secondaryTitle: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  secondaryBody: {
    color: "#444444",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
