import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AnimatedBackground from '../components/AnimatedBackground';
import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';

const profileImg = require('../../assets/user.webp');

const HEADER_HEIGHT = 320; // Adjusted for subscription header (can tweak as needed)

const Subscription = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  // Animation state for header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const anim = useRef(new Animated.Value(0)).current;

  // Animate header in/out
  const animateHeader = (show) => {
    Animated.timing(anim, {
      toValue: show ? 0 : -HEADER_HEIGHT,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Scroll handler
  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const delta = currentY - lastScrollY.current;
    if (Math.abs(delta) < 10) return;
    if (delta > 0 && isHeaderVisible && currentY > 40) {
      setIsHeaderVisible(false);
      animateHeader(false);
    } else if (delta < 0 && !isHeaderVisible && currentY < 60) {
      setIsHeaderVisible(true);
      animateHeader(true);
    }
    lastScrollY.current = currentY;
  };

  const subscriptionPlans = [
    {
      id: 1,
      title: 'Free Plan',
      price: '$0',
      period: 'month',
      features: [
        'Basic symptom checking',
        'Limited chat history',
        'Basic medical library access',
        'Standard support'
      ],
      current: true,
      popular: false,
    },
    {
      id: 2,
      title: 'Premium Plan',
      price: '$9.99',
      period: 'month',
      features: [
        'Advanced AI symptom analysis',
        'Unlimited chat history',
        'Full medical library access',
        'Priority support',
        'Medication reminders',
        'Health reports & insights'
      ],
      current: false,
      popular: true,
    },
    {
      id: 3,
      title: 'Family Plan',
      price: '$19.99',
      period: 'month',
      features: [
        'Up to 5 family members',
        'All Premium features',
        'Family health dashboard',
        'Shared medical history',
        'Emergency contacts sync',
        '24/7 support'
      ],
      current: false,
      popular: false,
    },
  ];

  return (
    <AnimatedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.contentSection}>
          <Animated.View
            style={[
              styles.animatedContent,
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: [{ translateY: anim }],
                opacity: anim.interpolate({
                  inputRange: [-HEADER_HEIGHT, 0],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Header
              profileImage={profileImg}
              greeting="Hello Scott"
              location="SC, 702 USA"
              sos={true}
            />
            <Text style={styles.title}>Subscription Plans</Text>
          </Animated.View>
          <View style={styles.listWrapper}>
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT }]}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.scrollView}
            >
              <View style={styles.plansList}>
                {subscriptionPlans.map((plan) => (
                  <View key={plan.id} style={[
                    styles.planCard,
                    plan.popular && styles.popularCard,
                    plan.current && styles.currentCard
                  ]}>
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Most Popular</Text>
                      </View>
                    )}
                    {plan.current && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentText}>Current Plan</Text>
                      </View>
                    )}
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{plan.price}</Text>
                      <Text style={styles.period}>/{plan.period}</Text>
                    </View>
                    <View style={styles.featuresList}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.subscribeButton,
                        plan.current && styles.currentButton
                      ]}
                      disabled={plan.current}
                    >
                      <Text style={[
                        styles.subscribeButtonText,
                        plan.current && styles.currentButtonText
                      ]}>
                        {plan.current ? 'Current Plan' : 'Subscribe'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

export default Subscription;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 36,
    color: '#4d5a5a',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 18,
  },
  contentSection: {
    paddingHorizontal: 18,
    flex: 1,
  },
  animatedContent: {
    zIndex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  listWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  plansList: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  planCard: {
    backgroundColor: '#d3cdc3',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  currentCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 24,
    color: '#222',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    color: '#6B705B',
    fontWeight: '700',
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#6B705B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: '#4CAF50',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  currentButtonText: {
    color: '#fff',
  },
}); 