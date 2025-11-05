# Outlook OAuth Setup Guide

## Overview

This guide helps you set up Microsoft Outlook OAuth2 authentication for the Interview Coordinator email integration.

## Prerequisites

- Azure account with access to Azure Active Directory
- Admin permissions to create app registrations

---

## Step 1: Create Azure AD App Registration

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Sign in with your organizational account

2. **Navigate to App Registrations**
   - Click **Azure Active Directory** (left sidebar)
   - Click **App registrations**
   - Click **+ New registration**

3. **Fill in Application Details**

   ```
   Name: Nexus Interview Coordinator
   Supported account types: Accounts in this organizational directory only (Single tenant)
   ```

4. **Configure Redirect URI**
   - Platform: **Web**
   - Production: `https://thesimpleai.vercel.app/api/auth/outlook/callback`
   - Development: `http://localhost:5000/api/auth/outlook/callback`

5. **Click Register**

---

## Step 2: Get Application Credentials

### Get Client ID

1. After registration, you'll see the **Overview** page
2. **Copy the "Application (client) ID"**
   - Example: `12345678-1234-1234-1234-123456789abc`
   - This is your `OUTLOOK_CLIENT_ID`

### Create Client Secret

1. In the left sidebar, click **Certificates & secrets**
2. Click **+ New client secret**
3. Add description: `Interview Coordinator Secret`
4. Choose expiration: **24 months** (recommended)
5. Click **Add**
6. **⚠️ IMPORTANT: Copy the "Value" immediately!**
   - You cannot view it again after leaving this page
   - This is your `OUTLOOK_CLIENT_SECRET`

### Get Tenant ID

1. Go back to **Overview** page
2. **Copy the "Directory (tenant) ID"**
   - Example: `87654321-4321-4321-4321-9876543210ab`
   - This is your `OUTLOOK_TENANT_ID`

---

## Step 3: Configure API Permissions

1. **In the left sidebar, click "API permissions"**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   ```
   ✅ Mail.Send          - Send mail as a user
   ✅ User.Read          - Sign in and read user profile
   ✅ Calendars.ReadWrite - Read and write user calendars
   ```
6. Click **Add permissions**
7. **Click "Grant admin consent for [Your Organization]"**
   - You need admin privileges for this step
   - This pre-approves the app for all users

---

## Step 4: Configure Backend Environment Variables

### Local Development (.env file)

1. **Create `.env` file in the backend directory** if it doesn't exist:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Add your Outlook OAuth credentials** to `.env`:
   ```env
   # Outlook OAuth Configuration
   OUTLOOK_CLIENT_ID=12345678-1234-1234-1234-123456789abc
   OUTLOOK_CLIENT_SECRET=your_secret_value_from_step_2
   OUTLOOK_TENANT_ID=87654321-4321-4321-4321-9876543210ab
   OUTLOOK_REDIRECT_URI=http://localhost:5000/api/auth/outlook/callback
   ```

### Production (Vercel)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `thesimpleai`

2. **Navigate to Settings → Environment Variables**

3. **Add these variables**:

   ```
   Name: OUTLOOK_CLIENT_ID
   Value: 12345678-1234-1234-1234-123456789abc
   Environment: Production, Preview, Development

   Name: OUTLOOK_CLIENT_SECRET
   Value: your_secret_value_from_step_2
   Environment: Production, Preview, Development

   Name: OUTLOOK_TENANT_ID
   Value: 87654321-4321-4321-4321-9876543210ab
   Environment: Production, Preview, Development

   Name: OUTLOOK_REDIRECT_URI
   Value: https://thesimpleai.vercel.app/api/auth/outlook/callback
   Environment: Production, Preview
   ```

4. **Redeploy** your application for changes to take effect

---

## Step 5: Test the Integration

### From the Application

1. **Login to your application**
   - Go to: https://thesimpleai.netlify.app/auth/login
   - Sign in with your account

2. **Navigate to Profile Settings**
   - Click your profile icon → **Profile**
   - Click **Email Integration** tab

3. **Connect Outlook**
   - Click **Connect Outlook** button
   - You'll be redirected to Microsoft login
   - Sign in with your organizational email
   - Grant permissions when prompted
   - You'll be redirected back to the app

4. **Verify Connection**
   - You should see "Connected" status with a green checkmark
   - You should now see "Disconnect" button

### Test Sending Interview Invitation

1. **Go to Interview Coordinator**
   - Navigate to `/interview-coordinator`

2. **Schedule an Interview**
   - Click **Schedule Interview**
   - Fill in candidate details
   - Select date/time
   - Click **Send Invitation**

3. **Check Email Sent**
   - The email should be sent from your connected Outlook account
   - Candidate should receive email with calendar invite (.ics file)
   - Interview should appear in your Outlook calendar

---

## Troubleshooting

### Error: "Outlook OAuth is not configured"

- **Solution**: Make sure all 4 environment variables are set correctly
- Restart your backend server after adding variables

### Error: "AADSTS700016: Application not found in directory"

- **Solution**: Check that `OUTLOOK_CLIENT_ID` matches your Azure app
- Verify `OUTLOOK_TENANT_ID` is correct

### Error: "invalid_client"

- **Solution**: Check that `OUTLOOK_CLIENT_SECRET` is correct
- The secret may have expired (check Azure → Certificates & secrets)

### Error: "redirect_uri_mismatch"

- **Solution**: Ensure the redirect URI in Azure matches your `OUTLOOK_REDIRECT_URI`
- Must match exactly (including http vs https)

### Error: "AADSTS65001: The user or administrator has not consented"

- **Solution**: Click "Grant admin consent" in Azure → API permissions
- Or have each user manually consent on first login

### Email not sending

1. **Check Outlook connection status** in Profile → Email Integration
2. **Reconnect Outlook** if showing disconnected
3. **Check backend logs** for detailed error messages
4. **Verify API permissions** in Azure AD

---

## Security Best Practices

### 1. Keep Secrets Safe

- ✅ Never commit `.env` file to git
- ✅ Use different secrets for dev and production
- ✅ Rotate secrets periodically (every 6-12 months)

### 2. Use Service Account

- ✅ Create a dedicated service account like `interviews@securemaxtech.com`
- ✅ Don't use personal Outlook accounts for production
- ✅ This account will appear as the sender of all interview emails

### 3. Monitor Usage

- ✅ Review Azure AD sign-in logs regularly
- ✅ Check for unusual authentication patterns
- ✅ Set up alerts for failed authentications

### 4. Limit Permissions

- ✅ Only request minimum necessary permissions
- ✅ Current permissions: Mail.Send, User.Read, Calendars.ReadWrite
- ✅ Don't add permissions you don't need

---

## Architecture Overview

```
┌─────────────┐     OAuth 2.0      ┌──────────────────┐
│   Frontend  │ ───────────────────▶│  Azure AD OAuth  │
│  (Netlify)  │                     │   Authorization  │
└─────────────┘                     └──────────────────┘
       │                                     │
       │                                     │ Token
       ▼                                     ▼
┌─────────────┐                     ┌──────────────────┐
│   Backend   │◀────────────────────│  Microsoft Graph │
│  (Vercel)   │     Send Email      │       API        │
└─────────────┘                     └──────────────────┘
       │
       │ Store access/refresh tokens
       ▼
┌─────────────┐
│  PostgreSQL │
│  Database   │
└─────────────┘
```

### Token Flow

1. User clicks "Connect Outlook" in frontend
2. Frontend redirects to Azure AD authorization URL
3. User signs in and grants permissions
4. Azure AD redirects back with authorization code
5. Backend exchanges code for access token + refresh token
6. Tokens are stored in database (encrypted)
7. Access token used to send emails via Microsoft Graph API
8. Refresh token used to get new access token when expired

---

## Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Azure AD OAuth 2.0 Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Graph Mail API](https://docs.microsoft.com/en-us/graph/api/user-sendmail)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs for detailed error messages
3. Verify all Azure AD configurations
4. Contact your Azure AD administrator if needed
