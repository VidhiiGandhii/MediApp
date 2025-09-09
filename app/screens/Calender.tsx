
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Calendar() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Calendar
         Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "600" },
});
