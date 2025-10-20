import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MainChat = () => {
  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.text}>Main Chat Screen (Placeholder)</Text>
      </ScrollView>
    </View>
  );
};

export default MainChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  text: {
    fontSize: 20,
    color: '#333',
  },
}); 