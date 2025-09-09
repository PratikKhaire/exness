# 📧 Email Authentication Setup Guide

## 🔧 How to Configure Email Authentication

### 1. Update your .env file with real credentials:

Replace the placeholder values in `/apps/trading-engine/.env`:

```bash
# Replace these with your actual email credentials:
SMTP_USER=your-actual-email@gmail.com
SMTP_PASS=your-actual-app-password
```

### 2. For Gmail Setup (Recommended):

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security" → "2-Step Verification"
3. Follow the setup process

#### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Other (Custom name)" and type "Exness Trading"
3. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)
4. Use this as your `SMTP_PASS` (remove spaces)

#### Step 3: Update .env file
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcdabcdabcdabcd  # Your 16-character app password
```

### 3. For Other Email Providers:

#### Outlook/Hotmail:
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@outlook.com
SMTP_PASS=your-password
```

#### Yahoo:
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@yahoo.com
SMTP_PASS=your-app-password  # Yahoo also requires app passwords
```

## 🚀 How to Test Email Authentication:

### 1. Start the server with auth:
```bash
cd apps/trading-engine
npx ts-node src/server-with-auth.ts
```

### 2. Test signup endpoint:
```bash
curl -X POST http://localhost:4001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 3. Test login endpoint:
```bash
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🔍 Troubleshooting:

### Common Issues:

1. **"Email service not configured"**
   - Check that all SMTP_ variables are set in .env
   - Restart the server after changing .env

2. **"Authentication failed"**
   - For Gmail: Make sure you're using app password, not regular password
   - Check that 2FA is enabled

3. **"Connection refused"**
   - Check SMTP_HOST and SMTP_PORT are correct
   - Try SMTP_SECURE=true for port 465

### Testing without real email:
You can test the API endpoints even without email configured. The server will return success messages but won't actually send emails.

## 📱 Frontend Integration:

Once email is working, you can integrate with your frontend:

```javascript
// Signup
const response = await fetch('http://localhost:4001/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Login
const response = await fetch('http://localhost:4001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});
```
