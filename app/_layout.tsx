import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync("#f8f3eb");
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: {
              backgroundColor: "#f8f3eb",
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)/settings" />
          <Stack.Screen name="(tabs)/simulation" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
