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
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { evaluateAPI } from '../services/apiService';
import * as Speech from 'expo-speech';

// Defined outside component so it's not recreated on every render
const LANGUAGE_CODES = {
  'japanese': 'ja-JP',
  'arabic': 'ar-SA',
  'german': 'de-DE',
  'italian': 'it-IT',
  'french': 'fr-FR',
  'spanish': 'es-ES',
  'portuguese': 'pt-PT',
  'chinese': 'zh-CN',
  'korean': 'ko-KR',
  'russian': 'ru-RU',
  'dutch': 'nl-NL',
  'turkish': 'tr-TR',
};

export default function LearnScreen({ navigation, route }) {
  const { activity } = route.params || {};
  const { selectedLanguage, fetchLanguageProgress } = useLanguage();
  const { user } = useUser();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Derive the target language BCP-47 code from the activity for TTS
  const targetLanguage = useMemo(() => {
    const lang = activity?.target_language?.toLowerCase() || 'fr';
    return LANGUAGE_CODES[lang] || lang; 
  }, [activity]);
    
  
   const speakText = useCallback((text) => {
    if (!text) return;
    Speech.stop();
    setIsSpeaking(true);
    
    Speech.speak(text, {
      language: targetLanguage, // Now uses 'ja-JP', 'ar-SA', etc.
      pitch: 1.0,
      rate: 0.9, // Slightly slower for learning purposes
      onDone: () => setIsSpeaking(false),
      onError: (error) => {
        console.error("TTS Error:", error);
        setIsSpeaking(false);
      },
    });
  }, [targetLanguage]);

  // Auto-play TTS when question changes for listening activities
  useEffect(() => {
    if (!activity) return;
    const q = questions[currentQuestion];
    if (!q) return;
    if (q.type === 'listening_easy') {
      speakText(q.sentence); // speak the full sentence so student hears the missing word in context
    } else if (q.type === 'listening_medium') {
      speakText(q.target_sentence);
    } else if (q.type === 'listening_hard' && activity?.content?.dialogue) {
      const lines = activity.content.dialogue.map(d => d.line).join('. ');
      speakText(lines);
    }
    return () => Speech.stop();
  }, [currentQuestion, activity]);

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text>No activity selected</Text>
      </View>
    );
  }

  // Parse activity content based on type and difficulty
  const getQuestions = () => {
    const content = activity.content || {};
    const type = activity.type || 'writing';
    const difficulty = activity.difficulty || 0;

    switch (type) {
      case 'listening':
        if (difficulty === 0) {
          // Easy listening: hear full sentence, pick the missing word
          return (content.tasks || []).map((task, idx) => ({
            id: idx,
            type: 'listening_easy',
            sentence: task.sentence,               // full sentence spoken via TTS
            sentence_with_blank: task.sentence_with_blank, // displayed with ____
            missing_word: task.missing_word,
            options: task.options || [],           // pre-generated shuffled options
          }));
        } else if (difficulty === 1) {
          // Medium listening: transcription
          return [{
            id: 0,
            type: 'listening_medium',
            sentence: content.sentence,
            target_sentence: content.target_sentence,
          }];
        } else {
          // Hard listening: comprehension
          return (content.questions || []).map((q, idx) => ({
            id: idx,
            type: 'listening_hard',
            question: q,
          }));
        }

      case 'writing':
        if (difficulty === 0) {
          // Easy writing: fill in blanks
          return (content.tasks || []).map((task, idx) => ({
            id: idx,
            type: 'writing_easy',
            sentence: task.sentence,
            missing_word: task.missing_word,
          }));
        } else {
          // Medium writing: essay
          return [{
            id: 0,
            type: 'writing_medium',
            essay_topic: content.essay_topic,
          }];
        }

      case 'reading':
        if (difficulty === 0) {
          // Easy reading: word matching
          return (content.tasks || []).map((task, idx) => ({
            id: idx,
            type: 'reading_easy',
            word: task.word,
            sentence: task.sentence,
            translation: task.translation,
            distractors: task.distractors || [],
          }));
        } else if (difficulty === 1) {
          // Medium reading: fill blanks
          return (content.tasks || []).map((task, idx) => ({
            id: idx,
            type: 'reading_medium',
            sentence: task.sentence,
            missing_word: task.missing_word,
            distractors: task.distractors || [],
          }));
        } else {
          // Hard reading: comprehension
          return (content.questions || []).map((q, idx) => ({
            id: idx,
            type: 'reading_hard',
            question: q,
            paragraph: content.paragraph,
          }));
        }

      default:
        return [{
          id: 0,
          type: 'writing',
          question: activity.title || 'Answer the question',
        }];
    }
  };

  const questions = getQuestions();

  // Pre-shuffle options once per question so they don't re-randomize on every render
  const shuffledOptions = useMemo(() => {
    if (!activity) return [];
    return questions.map((q) => {
      if (q.type === 'reading_easy') {
        return [...([q.translation, ...q.distractors])].sort(() => Math.random() - 0.5);
      }
      if (q.type === 'reading_medium') {
        return [...([q.missing_word, ...q.distractors])].sort(() => Math.random() - 0.5);
      }
      if (q.type === 'listening_easy') {
        // Options already shuffled by the AI agent — just use them as-is
        return [...q.options];
      }
      return [];
    });
  }, [activity]); // only recompute when the activity itself changes

  // Auto-play TTS when question changes for listening activities
  // Placed after questions/shuffledOptions so they are in scope
  useEffect(() => {
    if (!activity || !questions.length) return;
    const q = questions[currentQuestion];
    if (!q) return;
    if (q.type === 'listening_easy') {
      speakText(q.sentence);
    } else if (q.type === 'listening_medium') {
      speakText(q.target_sentence);
    } else if (q.type === 'listening_hard' && activity?.content?.dialogue) {
      const lines = activity.content.dialogue.map(d => d.line).join('. ');
      speakText(lines);
    }
    return () => Speech.stop();
  }, [currentQuestion, activity]);

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text>No activity selected</Text>
      </View>
    );
  }

  const handleAnswerChange = (text) => {
    setAnswers({ ...answers, [currentQuestion]: text });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setFeedback(null);
    }
  };

  const handleSubmit = async () => {
    if (!answers[currentQuestion]) {
      Alert.alert('Please provide an answer');
      return;
    }

    setIsSubmitting(true);
    try {
      const question = questions[currentQuestion];
      const userId = user?.id || 'user';
      let response;

      // Call appropriate evaluation endpoint based on activity type and difficulty
      // Pad answers so the current question's answer lands at the right task index.
      const paddedAnswers = questions.map((_, i) =>
        i === currentQuestion ? answers[currentQuestion] : ''
      );

      if (activity.type === 'listening') {
        if (activity.difficulty === 0) {
          const raw = await evaluateAPI.evaluateListeningEasy(
            activity._id || activity.id,
            paddedAnswers,
            userId
          );
          response = {
            ...raw,
            results: raw.results ? [raw.results[currentQuestion]] : raw.results,
          };
        } else if (activity.difficulty === 1) {
          // Medium listening is a single sentence — no padding needed
          response = await evaluateAPI.evaluateListeningMedium(
            activity._id || activity.id,
            answers[currentQuestion],
            userId
          );
        } else {
          const raw = await evaluateAPI.evaluateListeningHard(
            activity._id || activity.id,
            paddedAnswers,
            userId
          );
          response = {
            ...raw,
            results: raw.results ? [raw.results[currentQuestion]] : raw.results,
          };
        }
      } else if (activity.type === 'writing') {
        if (activity.difficulty === 0) {
          const raw = await evaluateAPI.evaluateWritingEasy(
            activity._id || activity.id,
            paddedAnswers,
            userId
          );
          response = {
            ...raw,
            results: raw.results ? [raw.results[currentQuestion]] : raw.results,
          };
        } else {
          // Medium writing is a single essay — no padding needed
          response = await evaluateAPI.evaluateWritingMedium(
            activity._id || activity.id,
            answers[currentQuestion],
            userId
          );
        }
      } else if (activity.type === 'reading') {
        // paddedAnswers already declared above — reused here for reading
        if (activity.difficulty === 0) {
          const raw = await evaluateAPI.evaluateReadingEasy(
            activity._id || activity.id,
            paddedAnswers,
            userId
          );
          // Show only the result for the current question
          response = {
            ...raw,
            results: raw.results ? [raw.results[currentQuestion]] : raw.results,
          };
        } else if (activity.difficulty === 1) {
          const raw = await evaluateAPI.evaluateReadingMedium(
            activity._id || activity.id,
            paddedAnswers,
            userId
          );
          response = {
            ...raw,
            results: raw.results ? [raw.results[currentQuestion]] : raw.results,
          };
        } else {
          const raw = await evaluateAPI.evaluateReadingHard(
            activity._id || activity.id,
            paddedAnswers,
            userId
          );
          response = {
            ...raw,
            results: raw.results ? [raw.results[currentQuestion]] : raw.results,
          };
        }
      }

      setFeedback(response);
    } catch (error) {
      Alert.alert('Error', 'Failed to evaluate answer: ' + error.message);
      console.error('Evaluation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    // Refresh progress so the Home screen progress bar updates immediately
    if (selectedLanguage) {
      const langId = selectedLanguage._id || selectedLanguage.id;
      await fetchLanguageProgress(langId);
    }
    navigation.navigate('HomeMain');
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activity.type?.toUpperCase()}</Text>
          <Text style={styles.progress}>
            {currentQuestion + 1}/{questions.length}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <Text style={styles.questionType}>{question.type?.toUpperCase()}</Text>

          {/* Listening Easy: hear sentence, pick the missing word */}
          {question.type === 'listening_easy' && (
            <>
              <Text style={styles.questionText}>What is the missing word?</Text>
              <TouchableOpacity
                style={styles.ttsButton}
                onPress={() => speakText(question.sentence)}
              >
                <Ionicons name={isSpeaking ? 'volume-high' : 'play-circle'} size={56} color="#FF6B6B" />
                <Text style={styles.ttsLabel}>{isSpeaking ? 'Playing…' : 'Tap to listen'}</Text>
              </TouchableOpacity>
              <Text style={styles.sentenceWithBlank}>{question.sentence_with_blank}</Text>
              <View style={styles.optionsContainer}>
                {shuffledOptions[currentQuestion].map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.option,
                      answers[currentQuestion] === option && styles.selectedOption,
                    ]}
                    onPress={() => handleAnswerChange(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Listening Medium: Transcription */}
          {question.type === 'listening_medium' && (
            <>
              <Text style={styles.questionText}>Listen and transcribe what you hear:</Text>
              <TouchableOpacity style={styles.ttsButton} onPress={() => speakText(question.target_sentence)}>
                <Ionicons name={isSpeaking ? 'volume-high' : 'play-circle'} size={56} color="#FF6B6B" />
                <Text style={styles.ttsLabel}>{isSpeaking ? 'Playing…' : 'Tap to listen'}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.inputBox}
                placeholder="Type what you hear..."
                value={answers[currentQuestion] || ''}
                onChangeText={handleAnswerChange}
                multiline
                numberOfLines={3}
                editable={!isSubmitting}
              />
            </>
          )}

          {/* Listening Hard: Comprehension */}
          {question.type === 'listening_hard' && (
            <>
              <TouchableOpacity
                style={styles.ttsButton}
                onPress={() => {
                  const lines = activity?.content?.dialogue?.map(d => d.line).join('. ') || '';
                  speakText(lines);
                }}
              >
                <Ionicons name={isSpeaking ? 'volume-high' : 'play-circle'} size={56} color="#FF6B6B" />
                <Text style={styles.ttsLabel}>{isSpeaking ? 'Playing…' : 'Tap to hear dialogue'}</Text>
              </TouchableOpacity>
              <Text style={styles.questionText}>{question.question}</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="Type your answer..."
                value={answers[currentQuestion] || ''}
                onChangeText={handleAnswerChange}
                multiline
                numberOfLines={3}
                editable={!isSubmitting}
              />
            </>
          )}

          {/* Writing Easy: Fill Blanks */}
          {question.type === 'writing_easy' && (
            <>
              <Text style={styles.questionText}>{question.sentence}</Text>
              <Text style={styles.hintText}>Missing word: {question.missing_word}</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="Fill in the blank..."
                value={answers[currentQuestion] || ''}
                onChangeText={handleAnswerChange}
                editable={!isSubmitting}
              />
            </>
          )}

          {/* Writing Medium: Essay */}
          {question.type === 'writing_medium' && (
            <>
              <Text style={styles.questionText}>Write an essay about:</Text>
              <Text style={styles.essayTopic}>{question.essay_topic}</Text>
              <TextInput
                style={[styles.inputBox, { minHeight: 150 }]}
                placeholder="Write your essay here..."
                value={answers[currentQuestion] || ''}
                onChangeText={handleAnswerChange}
                multiline
                numberOfLines={6}
                editable={!isSubmitting}
                textAlignVertical="top"
              />
            </>
          )}

          {/* Reading Easy: Word Matching */}
          {question.type === 'reading_easy' && (
            <>
              <Text style={styles.questionText}>What does "{question.word}" mean?</Text>
              <Text style={styles.hintText}>{question.sentence}</Text>
              <View style={styles.optionsContainer}>
                {shuffledOptions[currentQuestion].map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.option,
                      answers[currentQuestion] === option && styles.selectedOption,
                    ]}
                    onPress={() => handleAnswerChange(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Reading Medium: Fill Blanks */}
          {question.type === 'reading_medium' && (
            <>
              <Text style={styles.questionText}>{question.sentence}</Text>
              <Text style={styles.hintText}>Missing word: {question.missing_word}</Text>
              <View style={styles.optionsContainer}>
                {shuffledOptions[currentQuestion].map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.option,
                      answers[currentQuestion] === option && styles.selectedOption,
                    ]}
                    onPress={() => handleAnswerChange(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Reading Hard: Comprehension */}
          {question.type === 'reading_hard' && (
            <>
              <Text style={styles.paragraph}>{question.paragraph}</Text>
              <Text style={styles.questionText}>{question.question}</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="Type your answer..."
                value={answers[currentQuestion] || ''}
                onChangeText={handleAnswerChange}
                multiline
                numberOfLines={3}
                editable={!isSubmitting}
              />
            </>
          )}

          {/* Feedback */}
          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                feedback.total_score > 0 ? styles.correctBox : styles.incorrectBox,
              ]}
            >
              <Text style={styles.feedbackTitle}>
                {feedback.total_score > 0 ? '✓ Correct!' : '✗ Not quite'}
              </Text>
              <Text style={styles.feedbackText}>{feedback.feedback}</Text>
              {feedback.results && feedback.results.length > 0 && (
                <View style={styles.resultsContainer}>
                  {feedback.results.map((result, idx) => (
                    <Text key={idx} style={styles.resultText}>
                      {result.correct_word || result.word}: {result.user_answer}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, !currentQuestion && styles.disabled]}
          onPress={handlePrevious}
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
            <Text style={styles.submitText}>
              {isSubmitting ? 'Checking...' : 'Check Answer'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={
              currentQuestion < questions.length - 1
                ? handleNext
                : handleFinish
            }
          >
            <Text style={styles.submitText}>
              {currentQuestion < questions.length - 1 ? 'Next' : 'Finish'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.actionButton,
            currentQuestion === questions.length - 1 && styles.disabled,
          ]}
          onPress={handleNext}
          disabled={currentQuestion === questions.length - 1}
        >
          <Ionicons name="chevron-forward" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  progress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  questionType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    lineHeight: 26,
    marginBottom: 16,
  },
  ttsButton: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff8f5',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    width: 160,
  },
  ttsLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  sentenceWithBlank: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  word: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  essayTopic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  paragraph: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    marginTop: 12,
  },
  optionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  option: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#FF6B6B',
    backgroundColor: '#fff8f5',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  feedbackBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  correctBox: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  incorrectBox: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  resultsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  resultText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});