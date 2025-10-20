import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    answers: [],
    currentQuestionIndex: 0,
    isListening: false,
    transcript: '',
    medicalHistory: {},
};

export const userInfoSlice = createSlice({
    name: 'userInfo',
    initialState,
    reducers: {
        setAnswer: (state, action) => {
            const { index, answer, summarizedAnswer } = action.payload;
            const newAnswers = { ...state.answers };
            newAnswers[index] = {
                answer: answer,
                summarizedAnswer: summarizedAnswer || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
            };
            state.answers = newAnswers;
        },
        setCurrentIndex: (state, action) => {
            state.currentQuestionIndex = action.payload;
        },
        setIsListening: (state, action) => {
            state.isListening = action.payload;
        },
        setTranscript: (state, action) => {
            state.transcript = action.payload;
        },
        setMedicalHistory: (state, action) => {
            state.medicalHistory = { ...state.medicalHistory, ...action.payload };
        },
        resetUserInfo: () => initialState,
    },
});

export const {
    setAnswer,
    setCurrentIndex,
    setIsListening,
    setTranscript,
    setMedicalHistory,
    resetUserInfo
} = userInfoSlice.actions;

export const selectAnswers = (state) => state.userInfo.answers;
export const selectCurrentIndex = (state) => state.userInfo.currentQuestionIndex;
export const selectIsListening = (state) => state.userInfo.isListening;
export const selectTranscript = (state) => state.userInfo.transcript;
export const selectMedicalHistory = (state) => state.userInfo.medicalHistory;

export default userInfoSlice.reducer;