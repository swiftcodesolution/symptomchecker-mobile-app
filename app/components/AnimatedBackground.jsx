import { StyleSheet, View } from "react-native";
import { Video } from "expo-av";
import { LinearGradient } from "react-native-linear-gradient";
import { useState, useEffect, useRef } from "react";

const AnimatedBackground = ({ children }) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup video when component unmounts
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  const handleVideoError = (error) => {
    console.log("Video error:", error);
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  const handleVideoStatusUpdate = (status) => {
    if (status.isLoaded) {
      setVideoLoaded(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Background with proper error handling */}
      {!videoError && (
        <Video
          ref={videoRef}
          source={require('../../assets/bg-video.mp4')}
          style={styles.video}
          shouldPlay
          isLooping
          isMuted
          resizeMode="cover"
          onError={handleVideoError}
          onLoad={handleVideoLoad}
          onStatusUpdate={handleVideoStatusUpdate}
          useNativeControls={false}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
          playWhenInactive={false}
        />
      )}

      {/* Fallback Gradient Background when video fails */}
      {videoError && (
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View style={styles.screensContent}>{children}</View>
    </View>
  );
};

export default AnimatedBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  screensContent: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    backgroundColor: "transparent",
  },
});
