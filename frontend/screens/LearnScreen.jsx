import React, { useState, useEffect } from 'react';
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
import { evaluateAPI } from '../services/apiService';

export default function LearnScreen({ navigation, route }) {
  const { activity } = route.params || {};
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text>No activity selected</Text>
      </View>
    );
  }

  const questions = activity.questions || [
    {
      id: 1,
      question: activity.title,
      type: activity.type || 'writing',
      hint: 'Try to answer based on what you learned',
    },
  ];

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
      const response = await evaluateAPI.evaluateActivity(
        activity.id || activity._id,
        answers[currentQuestion]
      );
      setFeedback(response);
    } catch (error) {
      Alert.alert('Error', 'Failed to evaluate answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
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
          <Text style={styles.headerTitle}>Learn</Text>
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
        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionType}>{question.type.toUpperCase()}</Text>
          <Text style={styles.questionText}>{question.question}</Text>

          {question.hint && (
            <View style={styles.hintBox}>
              <Ionicons name="bulb" size={16} color="#FF6B6B" />
              <Text style={styles.hintText}>{question.hint}</Text>
            </View>
          )}

          {/* Input Area */}
          {question.type === 'writing' && (
            <TextInput
              style={styles.inputBox}
              placeholder="Type your answer here..."
              value={answers[currentQuestion] || ''}
              onChangeText={handleAnswerChange}
              multiline
              numberOfLines={4}
              editable={!isSubmitting}
            />
          )}

          {question.type === 'listening' && (
            <TouchableOpacity style={styles.audioButton}>
              <Ionicons name="play-circle" size={48} color="#FF6B6B" />
              <Text style={styles.audioText}>Tap to play audio</Text>
            </TouchableOpacity>
          )}

          {question.type === 'speaking' && (
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic-circle" size={48} color="#FF6B6B" />
              <Text style={styles.micText}>Tap to record</Text>
            </TouchableOpacity>
          )}

          {/* Feedback */}
          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                feedback.correct ? styles.correctBox : styles.incorrectBox,
              ]}
            >
              <Text style={styles.feedbackTitle}>
                {feedback.correct ? '✅ Correct!' : '❌ Not quite'}
              </Text>
              <Text style={styles.feedbackText}>{feedback.feedback}</Text>
              {feedback.correct_answer && (
                <Text style={styles.correctAnswer}>
                  Correct answer: {feedback.correct_answer}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Examples */}
        {question.examples && (
          <View style={styles.examplesBox}>
            <Text style={styles.examplesTitle}>Examples</Text>
            {question.examples.map((example, idx) => (
              <View key={idx} style={styles.exampleItem}>
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
          </View>
        )}
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
  hintBox: {
    backgroundColor: '#fff8f5',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
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
  audioButton: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 12,
  },
  audioText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 8,
    fontWeight: '600',
  },
  micButton: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 12,
  },
  micText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 8,
    fontWeight: '600',
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
  correctAnswer: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  examplesBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  exampleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#555',
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
