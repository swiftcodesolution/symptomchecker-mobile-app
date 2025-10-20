import type React from "react"
import { useEffect, useRef } from "react"
import { View, Animated, StyleSheet } from "react-native"

interface AnimatedSoundWavesProps {
  isActive: boolean
  color?: string
}

const AnimatedSoundWaves: React.FC<AnimatedSoundWavesProps> = ({ isActive, color = "#6B705B" }) => {
  const wave1 = useRef(new Animated.Value(0.3)).current
  const wave2 = useRef(new Animated.Value(0.5)).current
  const wave3 = useRef(new Animated.Value(0.7)).current
  const wave4 = useRef(new Animated.Value(0.5)).current
  const wave5 = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    if (isActive) {
      const createAnimation = (animatedValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValue, {
              toValue: 0.2,
              duration: 400,
              useNativeDriver: false,
            }),
          ]),
        )
      }

      const animations = [
        createAnimation(wave1, 0),
        createAnimation(wave2, 100),
        createAnimation(wave3, 200),
        createAnimation(wave4, 100),
        createAnimation(wave5, 0),
      ]

      animations.forEach((animation) => animation.start())

      return () => {
        animations.forEach((animation) => animation.stop())
      }
    } else {
      // Reset to initial values when not active
      wave1.setValue(0.3)
      wave2.setValue(0.5)
      wave3.setValue(0.7)
      wave4.setValue(0.5)
      wave5.setValue(0.3)
    }
  }, [isActive, wave1, wave2, wave3, wave4, wave5])

  return (
    <View style={styles.container}>
      {[wave1, wave2, wave3, wave4, wave5].map((wave, index) => (
        <Animated.View
          key={index}
          style={[
            styles.wave,
            {
              backgroundColor: color,
              transform: [
                {
                  scaleY: wave,
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    gap: 3,
  },
  wave: {
    width: 4,
    height: 40,
    borderRadius: 2,
    opacity: 0.8,
  },
})

export default AnimatedSoundWaves
