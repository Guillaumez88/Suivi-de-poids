import React, { ReactNode } from "react";
import { StyleSheet, ScrollView, View, ViewStyle, StyleProp } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, space } from "@/theme/theme";

interface Props {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EcranConteneur({ children, scroll = true, style }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {scroll ? (
        <ScrollView style={styles.contenu} contentContainerStyle={[styles.padding, style]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.contenu, styles.padding, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  contenu: { flex: 1 },
  padding: { paddingHorizontal: space[6], paddingBottom: space[8] },
});
