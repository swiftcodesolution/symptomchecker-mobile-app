// slices/userProfileSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
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
        // Load user data from Firestore
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        return {
          profileImage: savedImage,
          displayName: userData.displayName || user.displayName || '',
          email: userData.email || user.email || '',
          phoneNumber: userData.phoneNumber || '',
          address: userData.address || ''
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
  async ({ displayName, email, phoneNumber, address }, { rejectWithValue }) => {
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
          phoneNumber: phoneNumber,
          address: address,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        
        return { displayName, email, phoneNumber, address };
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
  phoneNumber: '',
  address: '',
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
      state.phoneNumber = action.payload.phoneNumber || '';
      state.address = action.payload.address || '';
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
        state.phoneNumber = action.payload.phoneNumber;
        state.address = action.payload.address;
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
        state.phoneNumber = action.payload.phoneNumber;
        state.address = action.payload.address;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setProfileImage, setUserData, setLoading, clearError, resetProfile } = userProfileSlice.actions;

export const selectProfileImage = (state) => state.userProfile.profileImage;

// Memoized selector to prevent unnecessary re-renders
export const selectUserData = createSelector(
  [(state) => state.userProfile],
  (userProfile) => ({
    displayName: userProfile.displayName,
    email: userProfile.email,
    phoneNumber: userProfile.phoneNumber,
    address: userProfile.address
  })
);

export const selectProfileLoading = (state) => state.userProfile.loading;
export const selectProfileError = (state) => state.userProfile.error;

export default userProfileSlice.reducer;