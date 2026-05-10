import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { evaluateAPI, recommendationAPI } from '../services/apiService';
import * as Speech from 'expo-speech';
  
const LANGUAGE_CODES = {
  'spanish': 'es-ES',
  'french': 'fr-FR',
  'german': 'de-DE',
  'japanese': 'ja-JP',
  'italian': 'it-IT',
  'english': 'en-US',
  'mandarin chinese': 'zh-CN',
  'chinese': 'zh-CN',
  'arabic': 'ar-SA',
  'hindi': 'hi-IN',
  'portuguese': 'pt-PT',
  'russian': 'ru-RU',
  'korean': 'ko-KR',
  'turkish': 'tr-TR',
  'vietnamese': 'vi-VN',
  'dutch': 'nl-NL',
  'swedish': 'sv-SE',
  'greek': 'el-GR',
  'polish': 'pl-PL',
  'indonesian': 'id-ID',
  'bengali': 'bn-BD',
};

const TYPE_CONFIG = {
  listening: { icon: 'headphones', color: ['#6f3a41', '#45B9B0'], label: 'Listening' },
  writing:   { icon: 'pencil',    color: ['#FFB6C1', '#FFA0B4'], label: 'Writing'   },
  reading:   { icon: 'book',      color: ['#FFD700', '#FFC700'], label: 'Reading'   },
};

const DIFFICULTY_LABELS = { 0: 'Easy', 1: 'Medium', 2: 'Hard' };

export default function LearnScreen({ navigation, route }) {
  const { activity, topicActivities } = route.params || {};
  const {
    selectedLanguage, activities, fetchLanguageProgress,
    fetchTopicProgress, topicProgress,
  } = useLanguage();
  const { user } = useUser();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allFeedback, setAllFeedback] = useState([]); // accumulate per-question feedback
  const [recommendation, setRecommendation] = useState(null);

  const targetLanguage = useMemo(() => {
    const lang = activity?.target_language?.toLowerCase() || 'fr';
    return LANGUAGE_CODES[lang] || lang;
  }, [activity]);

  const speakText = useCallback((text) => {
    if (!text) return;
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      language: targetLanguage,
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [targetLanguage]);

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 32 }}>No activity selected.</Text>
      </View>
    );
  }

  // ─── Parse questions ─────────────────────────────────────────────────────
  const getQuestions = () => {
    const content = activity.content || {};
    const type = activity.type || 'writing';
    const difficulty = activity.difficulty || 0;

    switch (type) {
      case 'listening':
        if (difficulty === 0)
          return (content.tasks || []).map((task, idx) => ({
            id: idx, type: 'listening_easy',
            sentence: task.sentence, sentence_with_blank: task.sentence_with_blank,
            missing_word: task.missing_word, options: task.options || [],
          }));
        if (difficulty === 1)
          return [{ id: 0, type: 'listening_medium', sentence: content.sentence, target_sentence: content.target_sentence }];
        return (content.questions || []).map((q, idx) => ({ id: idx, type: 'listening_hard', question: q }));

      case 'writing':
        if (difficulty === 0)
          return (content.tasks || []).map((task, idx) => ({
            id: idx, type: 'writing_easy', sentence: task.sentence, missing_word: task.missing_word,
          }));
        return [{ id: 0, type: 'writing_medium', essay_topic: content.essay_topic }];

      case 'reading':
        if (difficulty === 0)
          return (content.tasks || []).map((task, idx) => ({
            id: idx, type: 'reading_easy', word: task.word, sentence: task.sentence,
            translation: task.translation, distractors: task.distractors || [],
          }));
        if (difficulty === 1)
          return (content.tasks || []).map((task, idx) => ({
            id: idx, type: 'reading_medium', sentence: task.sentence,
            missing_word: task.missing_word, distractors: task.distractors || [],
          }));
        return (content.questions || []).map((q, idx) => ({
          id: idx, type: 'reading_hard', question: q, paragraph: content.paragraph,
        }));

      default:
        return [{ id: 0, type: 'writing', question: activity.title || 'Answer the question' }];
    }
  };

  const questions = getQuestions();

  const shuffledOptions = useMemo(() => questions.map((q) => {
    if (q.type === 'reading_easy') return [...([q.translation, ...q.distractors])].sort(() => Math.random() - 0.5);
    if (q.type === 'reading_medium') return [...([q.missing_word, ...q.distractors])].sort(() => Math.random() - 0.5);
    if (q.type === 'listening_easy') return [...q.options];
    return [];
  }), [activity]);

  useEffect(() => {
    if (!activity || !questions.length) return;
    const q = questions[currentQuestion];
    if (!q) return;
    if (q.type === 'listening_easy') speakText(q.sentence);
    else if (q.type === 'listening_medium') speakText(q.target_sentence);
    else if (q.type === 'listening_hard' && activity?.content?.dialogue)
      speakText(activity.content.dialogue.map(d => d.line).join('. '));
    return () => Speech.stop();
  }, [currentQuestion, activity]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleAnswerChange = (text) => setAnswers({ ...answers, [currentQuestion]: text });

const handleSubmit = async () => {
  const currentAnswer = answers[currentQuestion];
  if (!currentAnswer || (typeof currentAnswer === 'string' && !currentAnswer.trim())) {
    Alert.alert('Please provide an answer');
    return;
  }

  // ── Listening Easy: defer evaluation until all questions are done ──────────
  const type = activity.type;
  const diff = activity.difficulty || 0;
  if (type === 'listening' && diff === 0) {
    // Just mark this question as "answered" locally; no API call yet
    setAllFeedback(prev => {
      const existingIdx = prev.findIndex(f => f.question === currentQuestion);
      const entry = { question: currentQuestion, deferred: true, total_score: 0, feedback: '' };
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = entry;
        return next;
      }
      return [...prev, entry];
    });
    // Show a neutral placeholder so the Next button appears
    setFeedback({ deferred: true, total_score: 0, feedback: 'Answer recorded — keep going!' });
    return;                      // ← skip the API call entirely
  }
    
    setIsSubmitting(true);
    try {
      const userId = user?.id || 'user';
      const activityId = activity._id || activity.id;
      
      // ✅ FIX: Construct padded answers array with all questions answered
      // Each position contains the answer for that question, or empty string if unanswered
      const updatedAnswers = { ...answers, [currentQuestion]: currentAnswer };
      const paddedAnswersArray = questions.map((_, i) => updatedAnswers[i] || "");
      
      let response;
      const type = activity.type;
      const diff = activity.difficulty || 0;

      if (type === 'listening') {
        if (diff === 0) {
          // Easy: multiple choice questions - send array of all answers
          const raw = await evaluateAPI.evaluateListeningEasy(activityId, paddedAnswersArray, userId);
          response = { ...raw, results: raw.results ? [raw.results[currentQuestion]] : raw.results };
        } else if (diff === 1) {
          // Medium: transcription - send current answer only
          response = await evaluateAPI.evaluateListeningMedium(activityId, currentAnswer, userId);
        } else {
          // Hard: comprehension questions - send array of all answers
          const raw = await evaluateAPI.evaluateListeningHard(activityId, paddedAnswersArray, userId);
          response = { ...raw, results: raw.results ? [raw.results[currentQuestion]] : raw.results };
        }
      } else if (type === 'writing') {
        if (diff === 0) {
          // Easy: fill-in-the-blank - send array of all answers
          const raw = await evaluateAPI.evaluateWritingEasy(activityId, paddedAnswersArray, userId);
          response = { ...raw, results: raw.results ? [raw.results[currentQuestion]] : raw.results };
        } else if (diff === 1) {
          // Medium: essay - send current answer only
          response = await evaluateAPI.evaluateWritingMedium(activityId, currentAnswer, userId);
        } else if (diff === 2) {
          // Hard: essay - send current answer only
          response = await evaluateAPI.evaluateWritingHard(activityId, currentAnswer, userId);
        }
      } else if (type === 'reading') {
        if (diff === 0) {
          // Easy: vocabulary matching - send array of all answers
          const raw = await evaluateAPI.evaluateReadingEasy(activityId, paddedAnswersArray, userId);
          response = { ...raw, results: raw.results ? [raw.results[currentQuestion]] : raw.results };
        } else if (diff === 1) {
          // Medium: word selection - send array of all answers
          const raw = await evaluateAPI.evaluateReadingMedium(activityId, paddedAnswersArray, userId);
          response = { ...raw, results: raw.results ? [raw.results[currentQuestion]] : raw.results };
        } else {
          // Hard: comprehension - send array of all answers
          const raw = await evaluateAPI.evaluateReadingHard(activityId, paddedAnswersArray, userId);
          response = { ...raw, results: raw.results ? [raw.results[currentQuestion]] : raw.results };
        }
      }

      if (response) {
        setFeedback(response);
        // Check if we already have feedback for this question to avoid duplicates
        setAllFeedback(prev => {
          const existingIdx = prev.findIndex(f => f.question === currentQuestion);
          if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = { question: currentQuestion, ...response };
            return next;
          }
          return [...prev, { question: currentQuestion, ...response }];
        });
      }
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || 'Connection error';
      Alert.alert('Evaluation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null);
    }
  };

  const handleFinish = async () => {
    const type  = activity.type;
    const diff  = activity.difficulty || 0;

    // ── Listening Easy: all 5 answers must be present ────────────────────────
    if (type === 'listening' && diff === 0) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < questions.length) {
        Alert.alert(
          'Activity Incomplete',
          `You've only answered ${answeredCount} out of ${questions.length} questions. Please complete all of them.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Now send all answers at once
      setIsSubmitting(true);
      try {
        const userId     = user?.id || 'user';
        const activityId = activity._id || activity.id;
        const paddedAnswersArray = questions.map((_, i) => answers[i] || '');

        const raw = await evaluateAPI.evaluateListeningEasy(activityId, paddedAnswersArray, userId);

        // Rebuild allFeedback from the full results array
        const fullFeedback = questions.map((_, i) => ({
          question:    i,
          total_score: raw.results?.[i]?.correct ? 1 : 0,
          feedback:    raw.results?.[i]?.feedback || '',
          ...(raw.results?.[i] || {}),
        }));
        setAllFeedback(fullFeedback);
      } catch (error) {
        const msg = error.response?.data?.detail || error.message || 'Connection error';
        Alert.alert('Evaluation Failed', msg);
        setIsSubmitting(false);
        return;
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // ── All other types: original incomplete-guard ───────────────────────
      if (allFeedback.length < questions.length) {
        Alert.alert(
          'Activity Incomplete',
          `You've only answered ${allFeedback.length} out of ${questions.length} questions. Please complete all of them to see your results.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    if (selectedLanguage) {
      const langId = selectedLanguage._id || selectedLanguage.id;
      // We wrap these in a try-catch for robustness (internet connection edge case)
      try {
        await Promise.all([
          fetchLanguageProgress(langId),
          fetchTopicProgress(langId)
        ]);
      } catch (err) {
        console.warn('Failed to refresh progress on finish:', err);
      }
    }

    // Fetch recommendation
    const fetchRecommendation = async () => {
      try {
        const userId = user?.id || 'user';
        const userLang = 'English'; 
        const targetLang = selectedLanguage?.name || 'Spanish';
        
        const res = await recommendationAPI.getNext(userId, userLang, targetLang);
        if (res) {
          setRecommendation(res);
        }
      } catch (err) {
        console.warn('Recommendation error:', err);
      }
    };
    fetchRecommendation();

    setShowResults(true);
  };

  // ─── Result screen ────────────────────────────────────────────────────────
  if (showResults) {
    const totalScore = allFeedback.reduce((sum, f) => sum + (f.total_score || 0), 0);
    // If total_score is 1 per correct answer, we multiply by 100 and divide by total questions
    const avgScore = questions.length > 0 ? Math.round((totalScore / questions.length) * 100) : 0;
    const passed = avgScore >= 50;

    // Find activities of the same topic + same difficulty but different types
    const topicId = activity.topic_id;
    const difficulty = activity.difficulty ?? 0;
    const doneType = activity.type;

    // Use topicActivities passed in from ActivitiesScreen, or fall back to context activities
    const sourceActivities = (topicActivities && topicActivities.length > 0)
      ? topicActivities
      : activities;

    const suggested = sourceActivities.filter(a =>
      a.type !== doneType &&
      (a.difficulty ?? 0) === difficulty &&
      (a.topic_id === topicId || !topicId)
    );

    // Also figure out completion for this topic
    const topicCompletion = topicProgress[topicId] || {};
    const typesDone = topicCompletion[`${DIFFICULTY_LABELS[difficulty].toLowerCase()}_types_done`] || [];
    const allDone = ['listening', 'writing', 'reading'].every(t => typesDone.includes(t) || t === doneType);

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={passed ? ['#27ae60', '#2ecc71'] : ['#e74c3c', '#c0392b']}
          style={styles.resultHeader}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.navigate('HomeMain')}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.resultEmoji}>{passed ? <Ionicons name="trophy" size={40} color="#fff" /> : <Ionicons name="star" size={40} color="#fff" />}</Text>
          <Text style={styles.resultTitle}>{passed ? 'Activity Complete!' : 'Keep Practicing!'}</Text>
          <Text style={styles.resultSubtitle}>
            {activity.type?.charAt(0).toUpperCase() + activity.type?.slice(1)} · {DIFFICULTY_LABELS[difficulty]}
          </Text>

          {/* Score ring */}
          <View style={styles.scoreRing}>
            <Text style={styles.scoreNumber}>{avgScore}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.resultBody} showsVerticalScrollIndicator={false}>
          {/* Per-question summary */}
          <Text style={styles.sectionLabel}>Your Answers</Text>
          {allFeedback.map((f, i) => (
            <View key={i} style={[styles.feedbackRow, f.total_score > 0 ? styles.feedbackRowCorrect : styles.feedbackRowWrong]}>
              <Ionicons
                name={f.total_score > 0 ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={f.total_score > 0 ? '#27ae60' : '#e74c3c'}
              />
              <Text style={styles.feedbackRowText} numberOfLines={2}>
                Q{i + 1}: {f.feedback || (f.total_score > 0 ? 'Correct' : 'Incorrect')}
              </Text>
            </View>
          ))}

          {/* Topic progress indicator */}
          {topicId && (
            <View style={styles.topicProgressBox}>
              <Text style={styles.topicProgressTitle}>
                {allDone ? ' Topic Level Complete!' : ' Topic Progress'}
              </Text>
              <View style={styles.typeRow}>
                {['listening', 'writing', 'reading'].map(t => {
                  const done = typesDone.includes(t);
                  const isCurrent = t === doneType;
                  return (
                    <View key={t} style={[styles.typeChip, done ? styles.typeChipDone : isCurrent ? styles.typeChipCurrent : styles.typeChipPending]}>
                      <MaterialCommunityIcons
                        name={TYPE_CONFIG[t]?.icon || 'help-circle'}
                        size={14}
                        color={done || isCurrent ? '#fff' : '#999'}
                      />
                      <Text style={[styles.typeChipText, (done || isCurrent) && { color: '#fff' }]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {allDone && difficulty < 2 && (
                <Text style={styles.unlockedMsg}>
                  🔥 {DIFFICULTY_LABELS[difficulty + 1]} difficulty unlocked!
                </Text>
              )}
            </View>
          )}

          {/* Suggested next activities */}
          {suggested.length > 0 && !allDone && (
            <>
              <Text style={styles.sectionLabel}>Next Up for This Topic</Text>
              {suggested.map((act) => {
                const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.reading;
                const alreadyDone = typesDone.includes(act.type);
                return (
                  <TouchableOpacity
                    key={act._id || act.id}
                    style={styles.suggestionCard}
                    onPress={() => {
                      // Reset state and navigate to this activity
                      setCurrentQuestion(0);
                      setAnswers({});
                      setFeedback(null);
                      setAllFeedback([]);
                      setShowResults(false);
                    setRecommendation(null);
                    navigation.replace('Learn', { activity: act, topicActivities: sourceActivities });
                  }}
                >
                    <LinearGradient colors={cfg.color} style={styles.suggestionIcon}>
                      <MaterialCommunityIcons name={cfg.icon} size={22} color="#fff" />
                    </LinearGradient>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionType}>{cfg.label}</Text>
                      <Text style={styles.suggestionDiff}>{DIFFICULTY_LABELS[act.difficulty ?? 0]}</Text>
                    </View>
                    {alreadyDone
                      ? <Ionicons name="checkmark-circle" size={22} color="#27ae60" />
                      : <Ionicons name="chevron-forward" size={22} color="#FF6B6B" />
                    }
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* If all done for this level, show recommendation or fallback message */}
          <View style={styles.allDoneBox}>
            {recommendation ? (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 0, color: '#e67e22' }]}>AI Recommendation</Text>
                <Text style={styles.allDoneText}>{recommendation.reasoning}</Text>
              </>
            ) : allDone ? (
              <Text style={styles.allDoneText}> You've completed all activities for this topic at {DIFFICULTY_LABELS[difficulty]} level!</Text>
            ) : (
              <Text style={styles.allDoneText}>Complete all activity types (Listening, Writing, Reading) to get an AI recommendation!</Text>
            )}
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setCurrentQuestion(0);
                setAnswers({});
                setFeedback(null);
                setAllFeedback([]);
                setShowResults(false);
                setRecommendation(null);
              }}
            >
              <Ionicons name="refresh" size={18} color="#32435e" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => navigation.navigate('HomeMain')}
            >
              <Ionicons name="home" size={18} color="#fff" />
              <Text style={styles.homeBtnText}>Home</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ─── Activity screen ──────────────────────────────────────────────────────
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#32435e', '#32435e']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activity.type?.toUpperCase()}</Text>
          <Text style={styles.progress}>{currentQuestion + 1}/{questions.length}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <Text style={styles.questionType}>{question.type?.toUpperCase()}</Text>

          {question.type === 'listening_easy' && (
            <>
              <Text style={styles.questionText}>What is the missing word?</Text>
              <TouchableOpacity style={styles.ttsButton} onPress={() => speakText(question.sentence)}>
                <Ionicons name={isSpeaking ? 'volume-high' : 'play-circle'} size={56} color="#32435e" />
                <Text style={styles.ttsLabel}>{isSpeaking ? 'Playing…' : 'Tap to listen'}</Text>
              </TouchableOpacity>
              <Text style={styles.sentenceWithBlank}>{question.sentence_with_blank}</Text>
              <View style={styles.optionsContainer}>
                {shuffledOptions[currentQuestion].map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.option, answers[currentQuestion] === option && styles.selectedOption]}
                    onPress={() => handleAnswerChange(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {question.type === 'listening_medium' && (
            <>
              <Text style={styles.questionText}>Listen and transcribe what you hear:</Text>
              <TouchableOpacity style={styles.ttsButton} onPress={() => speakText(question.target_sentence)}>
                <Ionicons name={isSpeaking ? 'volume-high' : 'play-circle'} size={56} color="#32435e" />
                <Text style={styles.ttsLabel}>{isSpeaking ? 'Playing…' : 'Tap to listen'}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.inputBox} placeholder="Type what you hear..."
                value={answers[currentQuestion] || ''} onChangeText={handleAnswerChange}
                multiline numberOfLines={3} editable={!isSubmitting}
              />
            </>
          )}

          {question.type === 'listening_hard' && (
            <>
              <TouchableOpacity style={styles.ttsButton} onPress={() => {
                const lines = activity?.content?.dialogue?.map(d => d.line).join('. ') || '';
                speakText(lines);
              }}>
                <Ionicons name={isSpeaking ? 'volume-high' : 'play-circle'} size={56} color="#32435e" />
                <Text style={styles.ttsLabel}>{isSpeaking ? 'Playing…' : 'Tap to hear dialogue'}</Text>
              </TouchableOpacity>
              <Text style={styles.questionText}>{question.question}</Text>
              <TextInput
                style={styles.inputBox} placeholder="Type your answer..."
                value={answers[currentQuestion] || ''} onChangeText={handleAnswerChange}
                multiline numberOfLines={3} editable={!isSubmitting}
              />
            </>
          )}

          {question.type === 'writing_easy' && (
            <>
              <Text style={styles.questionText}>{question.sentence}</Text>
              <Text style={styles.hintText}>Missing word: {question.missing_word}</Text>
              <TextInput
                style={styles.inputBox} placeholder="Fill in the blank..."
                value={answers[currentQuestion] || ''} onChangeText={handleAnswerChange}
                editable={!isSubmitting}
              />
            </>
          )}

          {question.type === 'writing_medium' && (
            <>
              <Text style={styles.questionText}>Write an essay about:</Text>
              <Text style={styles.essayTopic}>{question.essay_topic}</Text>
              <TextInput
                style={[styles.inputBox, { minHeight: 150 }]} placeholder="Write your essay here..."
                value={answers[currentQuestion] || ''} onChangeText={handleAnswerChange}
                multiline numberOfLines={6} editable={!isSubmitting} textAlignVertical="top"
              />
            </>
          )}

          {question.type === 'reading_easy' && (
            <>
              <Text style={styles.questionText}>What does "{question.word}" mean?</Text>
              <Text style={styles.hintText}>{question.sentence}</Text>
              <View style={styles.optionsContainer}>
                {shuffledOptions[currentQuestion].map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.option, answers[currentQuestion] === option && styles.selectedOption]}
                    onPress={() => handleAnswerChange(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {question.type === 'reading_medium' && (
            <>
              <Text style={styles.questionText}>{question.sentence}</Text>
              <Text style={styles.hintText}>Choose the missing word</Text>
              <View style={styles.optionsContainer}>
                {shuffledOptions[currentQuestion].map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.option, answers[currentQuestion] === option && styles.selectedOption]}
                    onPress={() => handleAnswerChange(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {question.type === 'reading_hard' && (
            <>
              <Text style={styles.paragraph}>{question.paragraph}</Text>
              <Text style={styles.questionText}>{question.question}</Text>
              <TextInput
                style={styles.inputBox} placeholder="Type your answer..."
                value={answers[currentQuestion] || ''} onChangeText={handleAnswerChange}
                multiline numberOfLines={3} editable={!isSubmitting}
              />
            </>
          )}

          {/* Per-question feedback */}
          {feedback && (
            feedback.deferred ? (
              <View style={[styles.feedbackBox, { backgroundColor: '#EEF2FF', borderLeftWidth: 4, borderLeftColor: '#7C83FD' }]}>
                <Text style={styles.feedbackTitle}>📝 Answer recorded</Text>
                <Text style={styles.feedbackText}>Keep going — you'll see your score at the end!</Text>
              </View>
            ) : (
              <View style={[styles.feedbackBox, feedback.total_score > 0 ? styles.correctBox : styles.incorrectBox]}>
                <Text style={styles.feedbackTitle}>
                  {feedback.total_score > 0 ? '✓ Correct!' : '✗ Not quite'}
                </Text>
                <Text style={styles.feedbackText}>{feedback.feedback}</Text>
                {feedback.results?.length > 0 && (
                  <View style={styles.resultsContainer}>
                    {feedback.results.map((result, idx) => (
                      <Text key={idx} style={styles.resultText}>
                        {result.correct_word || result.word}: {result.user_answer}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, !currentQuestion && styles.disabled]}
          onPress={() => { setCurrentQuestion(q => q - 1); setFeedback(null); }}
          disabled={!currentQuestion}
        >
          <Ionicons name="chevron-back" size={20} color="#FF6B6B" />
        </TouchableOpacity>

        {!feedback ? (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitText}>{isSubmitting ? 'Checking...' : 'Check Answer'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={isLastQuestion ? handleFinish : handleNext}
          >
            <Text style={styles.submitText}>
              {isLastQuestion ? '🏁 See Results' : 'Next →'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, isLastQuestion && styles.disabled]}
          onPress={() => { setCurrentQuestion(q => q + 1); setFeedback(null); }}
          disabled={isLastQuestion}
        >
          <Ionicons name="chevron-forward" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Activity header
  header: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  progress: { fontSize: 14, fontWeight: '600', color: '#fff' },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },

  // Questions
  content: { flex: 1, padding: 16 },
  questionCard: { backgroundColor: '#f5f5f5', borderRadius: 16, padding: 20, marginBottom: 16 },
  questionType: { fontSize: 12, fontWeight: '700', color: '#FF6B6B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: '700', color: '#333', lineHeight: 26, marginBottom: 16 },
  ttsButton: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 20, padding: 16, borderRadius: 20, backgroundColor: '#fff8f5', borderWidth: 2, borderColor: '#FF6B6B', width: 160 },
  ttsLabel: { marginTop: 8, fontSize: 13, color: '#FF6B6B', fontWeight: '600' },
  sentenceWithBlank: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center', marginTop: 4, marginBottom: 8, lineHeight: 28 },
  essayTopic: { fontSize: 16, fontWeight: '600', color: '#FF6B6B', marginBottom: 12, fontStyle: 'italic' },
  paragraph: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  hintText: { fontSize: 13, color: '#666', marginBottom: 12, fontStyle: 'italic' },
  inputBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff', textAlignVertical: 'top', marginTop: 12 },
  optionsContainer: { marginTop: 12, gap: 8 },
  option: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#ddd', borderRadius: 12, padding: 12, alignItems: 'center' },
  selectedOption: { borderColor: '#FF6B6B', backgroundColor: '#fff8f5' },
  optionText: { fontSize: 14, color: '#333', fontWeight: '500' },
  feedbackBox: { marginTop: 16, padding: 12, borderRadius: 12 },
  correctBox: { backgroundColor: '#E8F5E9', borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  incorrectBox: { backgroundColor: '#FFEBEE', borderLeftWidth: 4, borderLeftColor: '#F44336' },
  feedbackTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  feedbackText: { fontSize: 13, color: '#666', lineHeight: 20 },
  resultsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  resultText: { fontSize: 12, color: '#666', marginBottom: 4 },

  // Bottom nav
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  actionButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.3 },
  submitButton: { flex: 1, borderRadius: 12, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ─── Results screen ───────────────────────────────────────────────────────
  resultHeader: { paddingTop: 24, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 16 },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 8 },
  resultEmoji: { fontSize: 52 },
  resultTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 8 },
  resultSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, marginBottom: 20 },
  scoreRing: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  scoreNumber: { fontSize: 32, fontWeight: '800', color: '#fff' },
  scoreLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  resultBody: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 12 },
  feedbackRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, marginBottom: 6 },
  feedbackRowCorrect: { backgroundColor: '#E8F5E9' },
  feedbackRowWrong: { backgroundColor: '#FFEBEE' },
  feedbackRowText: { flex: 1, fontSize: 13, color: '#333' },

  topicProgressBox: { backgroundColor: '#f0f0f5', borderRadius: 12, padding: 14, marginVertical: 12 },
  topicProgressTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e0e0e0' },
  typeChipDone: { backgroundColor: '#27ae60' },
  typeChipCurrent: { backgroundColor: '#FF6B6B' },
  typeChipPending: {},
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  unlockedMsg: { fontSize: 13, fontWeight: '700', color: '#e67e22', marginTop: 10 },

  suggestionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, marginBottom: 8 },
  suggestionIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  suggestionInfo: { flex: 1 },
  suggestionType: { fontSize: 15, fontWeight: '700', color: '#333' },
  suggestionDiff: { fontSize: 12, color: '#999', marginTop: 2 },

  allDoneBox: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16, marginVertical: 12, alignItems: 'center' },
  allDoneText: { fontSize: 14, fontWeight: '600', color: '#e67e22', textAlign: 'center', lineHeight: 20 },

  resultActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  retryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: '#FF6B6B', borderRadius: 12, paddingVertical: 12 },
  retryText: { fontSize: 14, fontWeight: '700', color: '#FF6B6B' },
  homeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FF6B6B', borderRadius: 12, paddingVertical: 12 },
  homeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});