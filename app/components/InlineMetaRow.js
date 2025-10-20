// components/InlineMetaRow.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * props:
 *  - items: [{ label: "Name", value: "Scott Grody" }, ...]
 *  - separator?: string  // default " | "
 *  - prefixLabel?: boolean // default true (shows "Label: Value")
 *  - style?: object // optional wrapper style
 *  - textStyle?: object // optional text style
 */
const InlineMetaRow = ({ items = [], separator = " | ", prefixLabel = true, style, textStyle }) => {
  const segments = items
    .filter(it => it && it.value != null && String(it.value).trim().length > 0)
    .map(it => prefixLabel ? `${it.label}: ${it.value}` : String(it.value).trim());

  if (segments.length === 0) {
    return (
      <View style={[styles.inlineRow, style]}>
        <Text style={[styles.inlineText, textStyle]}>—</Text>
      </View>
    );
  }

  return (
    <View style={[styles.inlineRow, style]}>
      <Text style={[styles.inlineText, textStyle]}>
        {segments.map((seg, i) => (
          <Text key={`${seg}-${i}`}>
            {i > 0 ? separator : ""}
            {seg}
          </Text>
        ))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  inlineText: {
    color: "#444",
    lineHeight: 20,
  },
});

export default InlineMetaRow;
