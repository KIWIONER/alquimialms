import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    rationale: string;
    hint: string;
}

interface QuizState {
    questions: Question[];
    currentIndex: number;
    answers: Record<string, number>;
    isSubmitted: boolean;
    mode: 'practice' | 'exam';
    difficulty: number;
    status: 'setup' | 'generating' | 'playing' | 'finished';
    selectedTopics: string[];
    
    // Actions
    setQuestions: (questions: Question[]) => void;
    setAnswer: (questionId: string, optionIndex: number) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    jumpToQuestion: (index: number) => void;
    submitQuiz: () => void;
    resetQuiz: () => void;
    setMode: (mode: 'practice' | 'exam') => void;
    setDifficulty: (level: number) => void;
    setStatus: (status: 'setup' | 'generating' | 'playing' | 'finished') => void;
    toggleTopic: (slug: string) => void;
}

export const useQuizStore = create<QuizState>()(
    persist(
        (set, get) => ({
            questions: [],
            currentIndex: 0,
            answers: {},
            isSubmitted: false,
            mode: 'practice',
            difficulty: 5,
            status: 'setup',
            selectedTopics: [],

            setQuestions: (questions) => set({ questions, answers: {}, currentIndex: 0, isSubmitted: false, status: 'playing' }),
            
            setAnswer: (questionId, optionIndex) => {
                const { isSubmitted } = get();
                if (isSubmitted) return;
                set((state) => ({
                    answers: { ...state.answers, [questionId]: optionIndex }
                }));
            },

            nextQuestion: () => {
                const { currentIndex, questions } = get();
                if (currentIndex < questions.length - 1) {
                    set({ currentIndex: currentIndex + 1 });
                }
            },

            prevQuestion: () => {
                const { currentIndex } = get();
                if (currentIndex > 0) {
                    set({ currentIndex: currentIndex - 1 });
                }
            },

            jumpToQuestion: (index) => set({ currentIndex: index }),

            submitQuiz: () => set({ isSubmitted: true, status: 'finished' }),

            resetQuiz: () => set({ 
                currentIndex: 0, 
                answers: {}, 
                isSubmitted: false,
                status: 'setup',
                questions: []
            }),

            setMode: (mode) => set({ mode }),
            setDifficulty: (level) => set({ difficulty: level }),
            setStatus: (status) => set({ status }),
            toggleTopic: (slug) => set((state) => {
                const isSelected = state.selectedTopics.includes(slug);
                return {
                    selectedTopics: isSelected 
                        ? state.selectedTopics.filter(t => t !== slug)
                        : [...state.selectedTopics, slug]
                };
            }),
        }),
        {
            name: 'alquimia-quiz-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
