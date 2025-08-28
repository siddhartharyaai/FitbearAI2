# 🚀 AIRTIGHT NETLIFY DEPLOYMENT - Fitbear AI

## 1️⃣ NETLIFY SITE SETTINGS

### Build Configuration
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 20 (set in .nvmrc or Netlify UI)
- **Plugin:** `@netlify/plugin-nextjs` (configured in netlify.toml)

### Function Settings
- **Timeout:** 26 seconds
- **Memory:** 1024MB
- **External modules:** Pre-bundled for faster cold starts

## 2️⃣ ENVIRONMENT VARIABLES

**CRITICAL:** Add these exact variables in Netlify → Site → Settings → Environment Variables:

```env
# ========== APP MODE (KILLS ALL DEMO/MOCKS) ==========
APP_MODE=production
NEXT_PUBLIC_APP_MODE=production
ALLOW_MOCKS=false
NEXT_PUBLIC_ALLOW_MOCKS=false

# ========== FEATURE FLAGS ==========
NEXT_PUBLIC_ENABLE_VISION_OCR=true
NEXT_PUBLIC_ENABLE_TTS=true
NEXT_PUBLIC_ENABLE_STT=true

# ========== BASE URL ==========
NEXT_PUBLIC_BASE_URL=https://YOUR-SITE.netlify.app

# ========== DATABASE (MongoDB Atlas) ==========
DB_PROVIDER=mongo
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/
MONGODB_DB=fitbear

# ========== SUPABASE AUTH (Email/Password) ==========
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ========== AI SERVICES ==========
GEMINI_API_KEY=your-gemini-key-here
DEEPGRAM_API_KEY=your-deepgram-key-here

# ========== ANALYTICS (Optional) ==========
NEXT_PUBLIC_POSTHOG_API_KEY=your-posthog-key-here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ========== RUNTIME ==========
NODE_VERSION=20
```

## 3️⃣ EXTERNAL SERVICE SETUP

### Supabase Dashboard Settings
1. **Authentication → Email → Enable signups** ✅
2. **Disable "Confirm email"** for immediate login ✅
3. **Keep OTP/Magic Links OFF** ✅
4. **Allow password signups** ✅

### MongoDB Atlas Setup
1. **Network Access:** Allow `0.0.0.0/0` (or specific IPs)
2. **Database User:** Create with `readWrite` access to `fitbear` database
3. **Connection String:** Use in `MONGODB_URI`

### API Keys Required
- **Gemini API:** Get from Google AI Studio
- **Deepgram API:** Get from Deepgram Console  
- **PostHog:** Optional, for analytics

## 4️⃣ DEPLOYMENT CHECKLIST

Before deploying, verify locally:

```bash
# Check for any remaining mock data
grep -RinE "dal|paneer|thali|demo|mock" app/app/api || echo "✅ No mock strings found"

# Build successfully
npm ci && npm run build

# Verify environment mode detection
node -e "console.log('APP_MODE:', process.env.APP_MODE || 'demo')"
```

## 5️⃣ POST-DEPLOY VERIFICATION

Use the comprehensive smoke test harness in `DEPLOYMENT_TESTS.md` to verify:

1. ✅ Production mode enabled (no mocks)
2. ✅ Email/password authentication working
3. ✅ Real database writes (profile, targets)
4. ✅ Live Gemini Vision OCR (menu scan, meal analysis)
5. ✅ Live Deepgram voice (TTS/STT)
6. ✅ Coach C LLM responses

## 6️⃣ TROUBLESHOOTING

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| 401/403 errors | Supabase token issue | Check auth settings, email confirmation disabled |
| 5xx on OCR/LLM | Missing API keys | Verify GEMINI_API_KEY in Netlify env |
| Mock data appearing | Demo mode active | Ensure APP_MODE=production, ALLOW_MOCKS=false |
| Function timeouts | Large requests | Images should be <5MB, check function limits |
| Database errors | Connection issues | Verify MONGODB_URI and network access |

## 7️⃣ SUCCESS CRITERIA

**ZERO TOLERANCE for demo/mock data in production!**

✅ `/api/whoami` returns `app_mode: "production"`, `allow_mocks: false`  
✅ Menu scan returns real OCR results (no dal/paneer defaults)  
✅ Meal analysis processes actual images (no thali fallbacks)  
✅ All user data persists to real MongoDB  
✅ Voice features use real Deepgram API  
✅ Authentication works end-to-end with email/password  

**Repository:** Clean, production-ready codebase  
**Deployment:** Netlify with all real integrations  
**Testing:** Comprehensive smoke tests passing  

🎯 **GOAL: Production-ready Fitbear AI with zero shortcuts!**