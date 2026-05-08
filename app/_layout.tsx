import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { brand } from "../src/theme/brand";

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(brand.colors.chrome);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar backgroundColor={brand.colors.chrome} style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: {
              backgroundColor: brand.colors.wall,
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="skeleton-lab" />
          <Stack.Screen name="(tabs)/settings" />
          <Stack.Screen name="(tabs)/simulation" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
