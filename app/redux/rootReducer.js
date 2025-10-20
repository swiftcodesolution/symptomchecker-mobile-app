import { combineReducers } from '@reduxjs/toolkit';
import userInfoSlice from './slices/userInfoSlice';
import userProfileSlice from './slices/userProfileSlice';

const rootReducer = combineReducers({
    userInfo: userInfoSlice,
    userProfile: userProfileSlice,
});

export default rootReducer;