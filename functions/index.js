const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
sgMail.setApiKey('YOUR_SENDGRID_API_KEY'); // Replace with your SendGrid API key

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
    from: 'your-verified-sender@yourdomain.com', // Must be verified in SendGrid
    subject: 'Your OTP Code - Symptom Checker App',
    text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Hello!</p>
        <p>Your verification code for the Symptom Checker App is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>This code will expire in 10 minutes.</strong></p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from the Symptom Checker App.</p>
      </div>
    `
  };
  
  try {
    await sgMail.send(msg);
    console.log(`OTP ${otp} sent successfully to ${email}`);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Email send error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send OTP');
  }
}); 