# 🚀 Magic Link Authentication Workflow

## 📋 Complete User Journey

### 1️⃣ **USER SIGNUP FLOW**

```
Frontend Form → Backend API → Database → Email Service → User's Inbox
```

#### Step 1: User Submits Signup Form
**Frontend Code:**
```javascript
// User enters email in signup form
const handleSignup = async (email) => {
  const response = await fetch('http://localhost:4001/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const result = await response.json();
  if (result.message) {
    alert('Check your email for verification link!');
  }
};
```

#### Step 2: Backend Processes Signup
**What happens in `/auth/signup` endpoint:**

1. **Validate Email**: Check if email is provided
2. **Check Duplicates**: Verify user doesn't already exist
3. **Create User Record**: 
   ```javascript
   users.set(email, {
     email: email,
     verified: false,        // Initially unverified
     createdAt: new Date()
   });
   ```

4. **Generate Magic Token**:
   ```javascript
   const token = crypto.randomBytes(32).toString('hex');
   // Creates: "a1b2c3d4e5f6...64-character-random-string"
   ```

5. **Store Token Temporarily**:
   ```javascript
   verificationTokens.set(token, {
     email: email,
     type: 'signup',
     expires: Date.now() + 15 * 60 * 1000  // 15 minutes from now
   });
   ```

6. **Send Magic Link Email**:
   ```javascript
   const magicLink = `http://localhost:3000/auth/verify?token=${token}&email=${email}`;
   // Sends email with this link
   ```

---

### 2️⃣ **EMAIL VERIFICATION FLOW**

#### Step 3: User Receives Email
**Email Content:**
```html
<h2>Welcome to Exness Trading Platform</h2>
<p>Click the button below to verify your email:</p>
<a href="http://localhost:3000/auth/verify?token=a1b2c3d4...&email=user@example.com">
  Verify Email
</a>
<p>This link expires in 15 minutes.</p>
```

#### Step 4: User Clicks Magic Link
**What happens when clicked:**

1. **Browser Opens**: `http://localhost:3000/auth/verify?token=xyz&email=user@example.com`

2. **Frontend Processes**: 
   ```javascript
   // Frontend extracts token and email from URL
   const urlParams = new URLSearchParams(window.location.search);
   const token = urlParams.get('token');
   const email = urlParams.get('email');
   
   // Calls backend verification
   fetch(`http://localhost:4001/auth/verify?token=${token}&email=${email}`)
   ```

3. **Backend Verifies**:
   ```javascript
   // Check if token exists and is valid
   const tokenData = verificationTokens.get(token);
   
   if (!tokenData) {
     return error('Invalid token');
   }
   
   if (Date.now() > tokenData.expires) {
     return error('Token expired');
   }
   
   if (tokenData.email !== email) {
     return error('Email mismatch');
   }
   
   // SUCCESS: Mark user as verified
   const user = users.get(email);
   user.verified = true;
   user.lastLogin = new Date();
   
   // Clean up: Remove used token
   verificationTokens.delete(token);
   ```

---

### 3️⃣ **USER LOGIN FLOW** (After Verification)

#### Step 5: Returning User Login
```javascript
// User enters email to login
const handleLogin = async (email) => {
  const response = await fetch('http://localhost:4001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
};
```

**Backend Login Process:**
1. **Check User Exists**: Verify email is in database
2. **Generate New Magic Token**: Fresh token for login
3. **Send Login Email**: Similar to signup, but for login
4. **User Clicks Link**: Same verification process
5. **Grant Access**: User can access trading platform

---

### 4️⃣ **PLATFORM ACCESS** (Final Step)

#### Step 6: Authenticated User Experience
```javascript
// After successful verification
const user = {
  email: "user@example.com",
  verified: true,
  lastLogin: "2025-09-09T10:30:00Z"
};

// User can now access:
// - Trading dashboard
// - Portfolio overview
// - Market data
// - Place trades
```

---

## 🔐 **Security Features**

### Token Security:
- **Unique**: Each token is cryptographically random (64 characters)
- **Temporary**: Expires in 15 minutes
- **Single Use**: Token is deleted after verification
- **Email Bound**: Token only works for specific email

### Database Storage:
```javascript
// Users table
users = {
  "user@example.com": {
    email: "user@example.com",
    verified: true,
    createdAt: "2025-09-09T10:15:00Z",
    lastLogin: "2025-09-09T10:30:00Z"
  }
}

// Temporary tokens (auto-expire)
verificationTokens = {
  "a1b2c3d4...": {
    email: "user@example.com",
    type: "signup",
    expires: 1725876300000  // Timestamp
  }
}
```

---

## 🛠️ **Implementation Status in Your Project**

### ✅ What's Already Built:
- Signup endpoint (`POST /auth/signup`)
- Login endpoint (`POST /auth/login`) 
- Verification endpoint (`GET /auth/verify`)
- Email sending with nodemailer
- Token generation and validation

### 🔧 What You Need to Configure:
1. **Email credentials** in `.env` file
2. **Frontend verification page** at `/auth/verify`
3. **User session management** (optional: JWT tokens)

### 🚀 Ready to Test:
```bash
# Start the auth server
cd apps/trading-engine
npx ts-node src/server-with-auth.ts

# Test signup
curl -X POST http://localhost:4001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

This creates a secure, passwordless authentication system where users only need their email to access your trading platform! 🎯
