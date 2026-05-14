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
    <View style={styles.screen}>
      <HomeHeroHolds />
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
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
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
});
