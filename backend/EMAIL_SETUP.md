# Email Service Configuration Guide

## Problem

The registration flow is failing because email verification codes cannot be sent. The backend logs show:

```
❌ [EMAIL] CRITICAL: Email credentials not configured
❌ [EMAIL] Set EMAIL_USER and EMAIL_PASS in Vercel environment variables
❌ [EMAIL] Email sending will FAIL until credentials are added
```

## Solution: Configure Gmail SMTP for Vercel

### Step 1: Generate Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "Enterprise AI Hub Backend"
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again!)

### Step 2: Add Environment Variables to Vercel

1. **Go to your Vercel Dashboard**:
   - Navigate to: https://vercel.com/dashboard
   - Select your project: `thesimpleai` (or your backend project)

2. **Add Environment Variables**:
   - Go to: Settings → Environment Variables
   - Add the following variables:

   | Variable Name | Value                          | Environment                      |
   | ------------- | ------------------------------ | -------------------------------- |
   | `EMAIL_USER`  | `your-email@securemaxtech.com` | Production, Preview, Development |
   | `EMAIL_PASS`  | `your-16-char-app-password`    | Production, Preview, Development |
   | `EMAIL_HOST`  | `smtp.gmail.com`               | Production, Preview, Development |
   | `EMAIL_PORT`  | `587`                          | Production, Preview, Development |

   **Example values:**

   ```bash
   EMAIL_USER=admin@securemaxtech.com
   EMAIL_PASS=abcd efgh ijkl mnop  # (16 characters from Gmail App Password)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   ```

3. **Save and Redeploy**:
   - After adding variables, redeploy your application
   - Go to: Deployments → Click "..." on latest deployment → "Redeploy"
   - OR push a new commit to trigger deployment

### Step 3: Verify Email Service

After redeployment, check the Vercel logs:

✅ **Success logs should show:**

```
✅ [EMAIL] SMTP transporter created successfully
✅ [EMAIL] Using: admin@securemaxtech.com
```

❌ **If still failing:**

```
❌ [EMAIL] CRITICAL: Email credentials not configured
```

→ Variables not set correctly, check Vercel dashboard

### Step 4: Test Registration Flow

1. Try registering a new user at: https://thesimpleai.netlify.app/auth/register
2. Check Vercel logs for email sending confirmation:
   ```
   📧 [EMAIL] Attempting to send verification code to: user@securemaxtech.com
   ✅ [EMAIL] Verification code sent successfully
   ```
3. Check your email inbox for the verification code

---

## Alternative: Use a Different Email Provider

### Option 1: Gmail (Recommended for Development)

- **Pros**: Easy setup, reliable
- **Cons**: Daily sending limits (500 emails/day), requires App Password

### Option 2: SendGrid (Recommended for Production)

- **Pros**: High deliverability, 100 emails/day free tier, professional service
- **Setup**:
  1. Sign up: https://sendgrid.com/
  2. Create API Key: Settings → API Keys
  3. Update Vercel variables:
     ```bash
     EMAIL_HOST=smtp.sendgrid.net
     EMAIL_PORT=587
     EMAIL_USER=apikey
     EMAIL_PASS=your_sendgrid_api_key
     ```

### Option 3: AWS SES (Recommended for Scale)

- **Pros**: Lowest cost at scale ($0.10 per 1000 emails), high deliverability
- **Cons**: Requires AWS account, more complex setup

### Option 4: Mailgun

- **Pros**: Developer-friendly, generous free tier (5000 emails/month)
- **Setup**: Similar to SendGrid

---

## Troubleshooting

### Issue: "Invalid login" or "Authentication failed"

**Cause**: Incorrect email or password
**Fix**:

- Verify EMAIL_USER is correct
- Regenerate Gmail App Password
- Ensure no spaces in password (Vercel might trim values)

### Issue: "Connection timeout"

**Cause**: Firewall or port blocking
**Fix**:

- Verify EMAIL_PORT is 587 (TLS)
- Try port 465 (SSL) if 587 fails
- Check Vercel's serverless function timeout

### Issue: "Transporter not initialized"

**Cause**: Environment variables not loaded
**Fix**:

- Verify variables are set for correct environment (Production/Preview)
- Redeploy after adding variables
- Check Vercel logs for "❌ [EMAIL] CRITICAL: Email credentials not configured"

### Issue: Emails sent but not received

**Cause**: Spam filtering
**Fix**:

- Check spam/junk folder
- Add sender to contacts
- For production: Set up SPF/DKIM records for your domain

---

## Current Backend Behavior (After Fix)

### ✅ GOOD: Registration fails gracefully if email cannot be sent

```javascript
// Backend now:
1. Creates user in database
2. Attempts to send verification email
3. If email fails → Deletes user and returns error
4. If email succeeds → Returns success with userId
```

### ✅ GOOD: Frontend handles errors correctly

```javascript
// Frontend now:
1. Calls registration API
2. If response.ok is false → Shows error, stays on page
3. If response.ok is true → Redirects to verification page
```

### ❌ BAD: Old behavior (fixed)

```javascript
// Old backend (wrong):
1. Created user
2. Returned success immediately
3. Tried to send email in background
4. If email failed → User created but no verification email!
```

---

## Security Best Practices

1. **Never commit credentials to git**
   - Use `.env` locally
   - Use Vercel environment variables in production

2. **Use App Passwords, not real passwords**
   - Never use your actual Gmail password
   - Regenerate App Password if compromised

3. **Monitor email sending**
   - Check Vercel logs regularly
   - Set up alerts for email failures

4. **Consider dedicated email service for production**
   - Gmail is OK for development/testing
   - Use SendGrid/AWS SES/Mailgun for production scale

---

## Quick Reference

### Local Development (.env)

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@securemaxtech.com
EMAIL_PASS=your_app_password
```

### Vercel Environment Variables

```bash
# Navigate to:
https://vercel.com/[your-username]/[project-name]/settings/environment-variables

# Add all four variables for all environments
```

### Test Email Sending

```bash
# Check backend logs in Vercel:
https://vercel.com/[your-username]/[project-name]/logs

# Look for:
✅ [EMAIL] SMTP transporter created successfully
✅ [EMAIL] Verification code sent successfully
```

---

## Next Steps

1. ✅ Generate Gmail App Password
2. ✅ Add environment variables to Vercel
3. ✅ Redeploy backend
4. ✅ Test registration flow
5. ✅ Monitor logs for email confirmation
6. 🔄 (Optional) Migrate to SendGrid/SES for production

---

**Questions?** Check Vercel logs for detailed error messages or contact your system administrator.
