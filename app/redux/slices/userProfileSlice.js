// slices/userProfileSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from '../../config/firebase';

// Async thunk to load profile image
export const loadProfileImage = createAsyncThunk(
  'userProfile/loadProfileImage',
  async (_, { rejectWithValue }) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const savedImage = await AsyncStorage.getItem(`profileImage_${user.uid}`);
        return {
          profileImage: savedImage,
          displayName: user.displayName || '',
          email: user.email || ''
        };
      }
      return rejectWithValue('No user found');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to save profile image
export const saveProfileImage = createAsyncThunk(
  'userProfile/saveProfileImage',
  async (imageUri, { rejectWithValue }) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        await AsyncStorage.setItem(`profileImage_${user.uid}`, imageUri);
        return imageUri;
      }
      return rejectWithValue('No user found');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to update user profile
export const updateUserProfile = createAsyncThunk(
  'userProfile/updateUserProfile',
  async ({ displayName, email }, { rejectWithValue }) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        // Update profile in Firebase Auth
        await updateProfile(user, { displayName });
        
        // Update in Firestore
        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
          displayName: displayName,
          email: email,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        
        return { displayName, email };
      }
      return rejectWithValue('No user found');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  profileImage: null,
  displayName: '',
  email: '',
  loading: false,
  error: null,
};

export const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setProfileImage: (state, action) => {
      state.profileImage = action.payload;
    },
    setUserData: (state, action) => {
      state.displayName = action.payload.displayName || '';
      state.email = action.payload.email || '';
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetProfile: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // loadProfileImage cases
      .addCase(loadProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadProfileImage.fulfilled, (state, action) => {
        state.loading = false;
        state.profileImage = action.payload.profileImage;
        state.displayName = action.payload.displayName;
        state.email = action.payload.email;
      })
      .addCase(loadProfileImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // saveProfileImage cases
      .addCase(saveProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveProfileImage.fulfilled, (state, action) => {
        state.loading = false;
        state.profileImage = action.payload;
      })
      .addCase(saveProfileImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateUserProfile cases
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.displayName = action.payload.displayName;
        state.email = action.payload.email;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setProfileImage, setUserData, setLoading, clearError, resetProfile } = userProfileSlice.actions;

export const selectProfileImage = (state) => state.userProfile.profileImage;
export const selectUserData = (state) => ({
  displayName: state.userProfile.displayName,
  email: state.userProfile.email
});
export const selectProfileLoading = (state) => state.userProfile.loading;
export const selectProfileError = (state) => state.userProfile.error;

export default userProfileSlice.reducer;