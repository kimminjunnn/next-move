import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeGlassCard } from "../src/components/HomeGlassCard";
import { HomeHeroHolds } from "../src/components/HomeHeroHolds";
import { brand } from "../src/theme/brand";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <HomeHeroHolds />

        <View style={styles.content}>
          <View style={styles.heroArea}>
            <HomeGlassCard />
          </View>

          <Pressable
            onPress={() => router.replace("/(tabs)/simulation")}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>시작하기</Text>
            <Ionicons
              color={brand.colors.primaryText}
              name="arrow-forward"
              size={30}
            />
          </Pressable>

          <Pressable
            onPress={() => router.push("/skeleton-lab")}
            style={styles.labButton}
          >
            <Ionicons color={brand.colors.text} name="body-outline" size={18} />
            <Text style={styles.labText}>스켈레톤 테스트</Text>
          </Pressable>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroArea: {
    flex: 1,
    justifyContent: "center",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 14,
    minHeight: 72,
    borderRadius: 24,
    backgroundColor: brand.colors.primary,
    shadowColor: brand.colors.primary,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 6,
  },
  ctaText: {
    color: brand.colors.primaryText,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  labButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 8,
    marginTop: 12,
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: brand.colors.accentSoft,
    borderWidth: 1,
    borderColor: brand.colors.border,
  },
  labText: {
    color: brand.colors.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
});
