import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeModules, Platform } from 'react-native';
import AnimatedBackground from './components/AnimatedBackground';

const TestNativeModule = () => {
  const { VoiceRecognition } = NativeModules;
  
  const nativeModules = Object.keys(NativeModules);
  const voiceRecognitionAvailable = !!VoiceRecognition;
  const voiceRecognitionKeys = VoiceRecognition ? Object.keys(VoiceRecognition) : [];

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Native Module Test</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Information</Text>
            <Text style={styles.text}>Platform: {Platform.OS}</Text>
            <Text style={styles.text}>Version: {Platform.Version}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Native Modules</Text>
            <Text style={styles.text}>Total modules: {nativeModules.length}</Text>
            {nativeModules.map((moduleName, index) => (
              <Text key={index} style={styles.text}>• {moduleName}</Text>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VoiceRecognition Status</Text>
            <Text style={styles.text}>Available: {voiceRecognitionAvailable ? 'Yes' : 'No'}</Text>
            {voiceRecognitionAvailable && (
              <>
                <Text style={styles.text}>Methods:</Text>
                {voiceRecognitionKeys.map((key, index) => (
                  <Text key={index} style={styles.text}>• {key}</Text>
                ))}
              </>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Information</Text>
            <Text style={styles.text}>VoiceRecognition object: {JSON.stringify(VoiceRecognition, null, 2)}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default TestNativeModule; 