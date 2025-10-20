# Firebase Functions Setup for OTP Email

## Current Implementation
The app currently simulates OTP sending by storing OTPs in Firestore. To send real emails, you need to set up Firebase Functions.

## Setup Steps

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Initialize Firebase Functions
```bash
firebase login
firebase init functions
```

### 3. Install Email Service (SendGrid Example)
```bash
cd functions
npm install @sendgrid/mail
```

### 4. Create OTP Function
Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

exports.sendOTP = functions.https.onCall(async (data, context) => {
  const { email, password } = data;
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store in Firestore
  const otpRef = admin.firestore().collection('otps').doc(email);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await otpRef.set({
    otp: otp,
    email: email,
    password: password,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: expiresAt
  });
  
  // Send email
  const msg = {
    to: email,
    from: 'your-verified-sender@yourdomain.com',
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
    html: `
      <h2>Your OTP Code</h2>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `
  };
  
  try {
    await sgMail.send(msg);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Email send error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send OTP');
  }
});
```

### 5. Update App to Use Functions
In your signup.jsx, replace the simulated email with:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendOTPFunction = httpsCallable(functions, 'sendOTP');

const sendOTPEmail = async (email, password) => {
  try {
    const result = await sendOTPFunction({ email, password });
    return result.data;
  } catch (error) {
    throw error;
  }
};
```

## Alternative Email Services
- **Mailgun**: `npm install mailgun.js`
- **AWS SES**: `npm install @aws-sdk/client-ses`
- **Nodemailer**: `npm install nodemailer`

## Free Tier Limits
- **Firebase Functions**: 125K invocations/month
- **SendGrid**: 100 emails/day (free tier)
- **Mailgun**: 5,000 emails/month (free tier)

## Security Rules
Add Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /otps/{email} {
      allow read, write: if request.auth != null && request.auth.token.email == email;
    }
  }
}
```

## Testing
1. Deploy functions: `firebase deploy --only functions`
2. Test OTP sending in your app
3. Check Firestore for OTP storage
4. Verify email delivery 