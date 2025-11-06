import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';

import AnimatedBackground from '../components/AnimatedBackground';
import Header from '../components/Header';
import { useTheme } from '../theme/ThemeContext';

import { firestore, firebaseAuth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { personalQuestionsData } from '../collect-user-info/PersonalInfoForm';
import { yesNoQuestionsData } from '../collect-user-info/YesNoQuestionsForm';
import { questionsData } from '../collect-user-info';
import { selectAnswers } from '../redux/slices/userInfoSlice';
import { savePhoneNumber, saveAddress, getSavedData } from '../utils/storage';

const profileImg = require('../../assets/user.webp');

// Keep exact order with global indices aligned to questionsData
const baseQuestionList = questionsData.map((q, i) => ({ id: i + 1, text: q.question }));

const HEADER_HEIGHT = 380;

const MedicalHistory = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState([]);
  const lastScrollY = useRef(0);
  const anim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [savedContacts, setSavedContacts] = useState({ phone: null, address: null });

  // Redux answers are primary SOT (fallback after refresh)
  const localAnswers = useSelector(selectAnswers);

  // Partitions (according to your current schema/order)
  const personalItems = useMemo(() => questions.slice(0, 10), [questions]);

  console.log('personalItems', personalItems);

  // Phone and address save logic - FIXED VERSION
  useEffect(() => {
    if (questions.length > 0) {
      savePhoneAndAddress();
      loadSavedContacts();
    }
  }, [questions]); // Use questions instead of personalItems

  const savePhoneAndAddress = async () => {
    try {
      // Use questions array directly to avoid dependency issues
      const personalItemsFromQuestions = questions.slice(0, 13);
      
      // Debug: Log all items to see the correct mapping
      console.log('🔍 All personal items:', personalItemsFromQuestions.map(item => ({
        id: item.id,
        text: item.text,
        fullAnswer: item.fullAnswer
      })));
      
      // Find phone number by text content (more reliable than ID)
      const phoneItem = personalItemsFromQuestions.find(item => 
        item.text && item.text.toLowerCase().includes('phone number')
      );
      if (phoneItem && phoneItem.fullAnswer && phoneItem.fullAnswer !== 'No answer provided') {
        await savePhoneNumber(phoneItem.fullAnswer);
        console.log('🔍 Phone number saved:', phoneItem.fullAnswer);
      }

      // Find home address by text content (more reliable than ID)
      const addressItem = personalItemsFromQuestions.find(item => 
        item.text && item.text.toLowerCase().includes('home address')
      );
      if (addressItem && addressItem.fullAnswer && addressItem.fullAnswer !== 'No answer provided') {
        await saveAddress(addressItem.fullAnswer);
        console.log('🔍 Address saved:', addressItem.fullAnswer);
      }
    } catch (error) {
      console.error('Error saving phone and address:', error);
    }
  };

  const loadSavedContacts = async () => {
    try {
      const data = await getSavedData();
      setSavedContacts(data);
      console.log('Loaded saved contacts:', data);
    } catch (error) {
      console.error('Error loading saved contacts:', error);
    }
  };

  // Rest of your existing code remains the same...
  // First hydrate from Firestore only if no local answers present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const base = [...baseQuestionList];
        const hasLocal = Object.keys(localAnswers || {}).length > 0;

        if (hasLocal) {
          const merged = base.map((q, idx) => {
            const a = localAnswers[idx] || {};
            return {
              ...q,
              fullAnswer: typeof a.answer === 'string' ? a.answer : 'No answer provided',
              summarizedAnswer:
                typeof a.summarizedAnswer === 'string' ? a.summarizedAnswer : 'No summary available',
            };
          });
          if (mounted) {
            setQuestions(merged);
            setLoading(false);
          }
          return;
        }

        const user = firebaseAuth.currentUser;
        if (!user) {
          if (mounted) {
            setQuestions(
              base.map((q) => ({
                ...q,
                fullAnswer: 'No answer provided',
                summarizedAnswer: 'No summary available',
              }))
            );
            setLoading(false);
          }
          return;
        }

        const snap = await getDoc(doc(firestore, 'users', user.uid));
        const fbAnswers = snap.exists() && Array.isArray(snap.data()?.answers) ? snap.data().answers : [];

        const fromFb = base.map((q, idx) => {
          const r = fbAnswers[idx] || {};
          return {
            ...q,
            fullAnswer: typeof r.answer === 'string' ? r.answer : 'No answer provided',
            summarizedAnswer: typeof r.summarizedAnswer === 'string' ? r.summarizedAnswer : 'No summary available',
          };
        });

        if (mounted) {
          setQuestions(fromFb);
          setLoading(false);
        }
      } catch (e) {
        console.error('MedicalHistory initial load error:', e);
        if (mounted) {
          const base = baseQuestionList.map((q, idx) => {
            const a = localAnswers[idx] || {};
            return {
              ...q,
              fullAnswer: typeof a.answer === 'string' ? a.answer : 'No answer provided',
              summarizedAnswer: typeof a.summarizedAnswer === 'string' ? a.summarizedAnswer : 'No summary available',
            };
          });
          setQuestions(base);
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Keep cards synced when redux answers change
  useEffect(() => {
    if (!questions.length) return;
    setQuestions((prev) =>
      prev.map((q, idx) => {
        const a = localAnswers[idx] || {};
        return {
          ...q,
          fullAnswer: typeof a.answer === 'string' ? a.answer : 'No answer provided',
          summarizedAnswer: typeof a.summarizedAnswer === 'string' ? a.summarizedAnswer : 'No summary available',
        };
      })
    );
  }, [localAnswers]);

  // ===== Helpers (use Firestore-merged questions[] first, Redux as fallback) =====
  const idxInMaster = (qText) => questionsData.findIndex((qq) => qq.question === qText);

  // Prefer questions[] (merged from Firestore), fallback to Redux store
  const getAnswerFor = (qText) => {
    const gIdx = idxInMaster(qText);
    const fromQuestions = (questions?.[gIdx]?.fullAnswer || '').trim();
    const fromRedux = ((localAnswers?.[gIdx]?.answer) || '').trim();
    const candidate = fromQuestions && fromQuestions !== 'No answer provided' ? fromQuestions : fromRedux;
    return (candidate || '').toLowerCase();
  };

  const isYesSelected = (qText) => {
    const val = getAnswerFor(qText);
    return val === 'yes' || val === 'yeah' || val === 'yep' || val === 'y';
  };

  // YES ONLY: map parents that are yes, attach dependent (details)
  const yesOnlyParents = useMemo(() => {
    return yesNoQuestionsData
      .filter((q) => q.type === 'yesno' && isYesSelected(q.question))
      .map((parent) => {
        const dependent = yesNoQuestionsData.find((d) => d.dependsOn === parent.field) || null;
        const parentGlobalIdx = idxInMaster(parent.question);
        const depGlobalIdx = dependent ? idxInMaster(dependent.question) : -1;

        const parentCard = questions[parentGlobalIdx];
        const depCard = depGlobalIdx >= 0 ? questions[depGlobalIdx] : null;

        // extra fallback in case depCard has placeholder
        const depAnsRaw =
          depCard?.fullAnswer && depCard.fullAnswer !== 'No answer provided'
            ? depCard.fullAnswer
            : (localAnswers?.[depGlobalIdx]?.answer || '');

        return {
          parent,
          dependent,
          parentCard,
          depCard,
          depAnsRaw,
        };
      });
  }, [questions, localAnswers]);

  // Navigation helpers
  const handleEditPersonal = () => {
    router.push({
      pathname: '/collect-user-info',
      params: { editMedical: 'true', questionIndex: '0', form: 'personal', fromMedicalHistory: 'true' },
    });
  };

  const handleEditYesNo = () => {
    router.push({
      pathname: '/collect-user-info',
      params: { editMedical: 'true', questionIndex: '13', form: 'yesno', fromMedicalHistory: 'true' },
    });
  };

  // Header show/hide on scroll
  const animateHeader = (show) => {
    Animated.timing(anim, {
      toValue: show ? 0 : -HEADER_HEIGHT,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

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

  // Completion bar
  const { total, answered, percent } = useMemo(() => {
    const totalQ = questions.length || 0;
    const answeredQ = questions.reduce((acc, q) => {
      const hasAnswer = q?.fullAnswer && q.fullAnswer !== 'No answer provided';
      return acc + (hasAnswer ? 1 : 0);
    }, 0);
    const pct = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0;
    return { total: totalQ, answered: answeredQ, percent: pct };
  }, [questions]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: isFinite(percent) ? percent / 100 : 0,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);

  // Updated render function to show saved contacts
  const renderPersonalItem = (q) => {
    const hasAnswer = q.fullAnswer && q.fullAnswer !== 'No answer provided';
    
    // Phone number और address के लिए special handling
    let displayValue = hasAnswer ? q.fullAnswer : 'No answer provided';
    let isSaved = false;
    
    // Use text-based matching instead of ID-based matching
    if (q.text && q.text.toLowerCase().includes('phone number') && savedContacts.phone) {
      displayValue = savedContacts.phone;
      isSaved = true;
    } else if (q.text && q.text.toLowerCase().includes('home address') && savedContacts.address) {
      displayValue = savedContacts.address;
      isSaved = true;
    }

    return (
      <TouchableOpacity key={`personal-${q.id}`} style={styles.itemRow} onPress={handleEditPersonal}>
        <Ionicons
          name={hasAnswer ? 'checkmark-done-circle-outline' : 'alert-circle-outline'}
          size={22}
          color={hasAnswer ? '#00C853' : '#FFA500'}
          style={styles.checkIcon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.questionText}>{q.text}</Text>
          <Text style={hasAnswer || isSaved ? styles.answerText : styles.noAnswerText}>
            {displayValue.length > 60 ? displayValue.slice(0, 60) + '...' : displayValue}
            {isSaved && ' ✓'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || saving) {
    return (
      <AnimatedBackground>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
      </AnimatedBackground>
    );
  }

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
                marginLeft: '5%',
                transform: [{ translateY: anim }],
                opacity: anim.interpolate({ inputRange: [-HEADER_HEIGHT, 0], outputRange: [0, 1] }),
              },
            ]}
          >
            <Header profileImage={profileImg} greeting="Hello Scott" location="SC, 702 USA" sos={true} medical={true} />
            <Text style={styles.title}>Medical History</Text>

            {/* Completion Bar */}
            <View style={styles.progressContainer} accessible accessibilityLabel="Medical history completion">
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Completion</Text>
                <Text style={styles.progressValue}>{percent}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme?.primary ?? '#00C853',
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressSubtext}>
                {answered} of {total} answered
              </Text>
            </View>
          </Animated.View>

          <View style={styles.listWrapper}>
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT }]}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.scrollView}
            >
              {/* Personal Details */}
              <View style={styles.groupCard}>
                <Text style={styles.groupTitle}>Personal Details</Text>
                {personalItems.map(renderPersonalItem)}
                <TouchableOpacity style={styles.groupEditBtn} onPress={handleEditPersonal}>
                  <Text style={styles.groupEditText}>Edit</Text>
                </TouchableOpacity>

                {/* Saved Contacts Display */}
                {/* {(savedContacts.phone || savedContacts.address) && (
                  <View style={styles.savedContactsContainer}>
                    <Text style={styles.savedContactsTitle}>📱 Saved Contacts:</Text>
                    {savedContacts.phone && (
                      <Text style={styles.savedContactItem}>Phone: {savedContacts.phone}</Text>
                    )}
                    {savedContacts.address && (
                      <Text style={styles.savedContactItem}>Address: {savedContacts.address}</Text>
                    )}
                  </View>
                )} */}
              </View>

              {/* Yes/No — YES ONLY */}
              <View style={styles.groupCard}>
                <Text style={styles.groupTitle}>Medical Questionnaire</Text>

                {yesOnlyParents.length === 0 && (
                  <View style={{ paddingVertical: 6 }}>
                    <Text style={{ color: '#666', fontStyle: 'italic' }}>No items marked "Yes".</Text>
                  </View>
                )}

                {yesOnlyParents.map(({ parent, parentCard, dependent, depCard, depAnsRaw }, idx) => {
                  const detailsAnswer = (depAnsRaw || '').trim();

                  return (
                    <TouchableOpacity key={`yesonly-${idx}`} style={styles.itemRow} onPress={handleEditYesNo}>
                      <Ionicons
                        name="checkmark-done-circle-outline"
                        size={22}
                        color="#00C853"
                        style={styles.checkIcon}
                      />
                      <View style={styles.textContainer}>
                        <Text style={styles.questionText}>{parent.question}</Text>
                        <Text style={[styles.answerText, { fontWeight: '700' }]}>Yes</Text>

                        {dependent && (
                          <View style={{ marginTop: 6 }}>
                            <Text style={[styles.questionText, { fontSize: 14 }]}>{dependent.question}</Text>
                            <Text style={detailsAnswer ? styles.answerText : styles.noAnswerText}>
                              {detailsAnswer
                                ? detailsAnswer.length > 80
                                  ? detailsAnswer.slice(0, 80) + '...'
                                  : detailsAnswer
                                : 'No details provided'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity style={styles.groupEditBtn} onPress={handleEditYesNo}>
                  <Text style={styles.groupEditText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  title: { fontSize: 36, color: '#4d5a5a', textAlign: 'center', fontWeight: '400', marginBottom: 12 },
  contentSection: { paddingHorizontal: 18, flex: 1 },
  animatedContent: { zIndex: 1, backgroundColor: 'transparent', width: '100%' },
  listWrapper: { flex: 1, marginTop: '10%' },
  scrollView: { flex: 1 },

  groupCard: {
    backgroundColor: '#d3cdc3',
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  groupTitle: { fontSize: 20, color: '#222', fontWeight: '700', marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  checkIcon: { marginRight: 12 },
  textContainer: { flex: 1, marginLeft: 10 },
  questionText: { fontSize: 16, color: '#222', fontWeight: '600' },
  answerText: { fontSize: 14, color: '#4d5a5a', marginTop: 4 },
  noAnswerText: { fontSize: 14, color: '#FFA500', marginTop: 4, fontStyle: 'italic' },
  groupEditBtn: { marginTop: 6, alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'transparent' },
  groupEditText: { color: '#222', fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },

  progressContainer: {
    marginTop: 4,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  progressLabel: { fontSize: 14, color: '#222', fontWeight: '700' },
  progressValue: { fontSize: 14, color: '#222', fontWeight: '700' },
  progressTrack: {
    height: 10,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#4d5a5a',
  },
  savedContactsContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00C853',
  },
  savedContactsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  savedContactItem: {
    fontSize: 14,
    color: '#4d5a5a',
    marginBottom: 4,
  },
});

export default MedicalHistory;