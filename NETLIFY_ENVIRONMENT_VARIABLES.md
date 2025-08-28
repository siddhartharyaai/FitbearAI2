# 🔧 NETLIFY ENVIRONMENT VARIABLES - PRODUCTION DEPLOYMENT

## CRITICAL: Add these EXACT variables to Netlify Dashboard

**Go to:** Site Settings → Environment Variables → Add Variable

## 🎯 PRODUCTION MODE (MANDATORY)
```
APP_MODE=production
NEXT_PUBLIC_APP_MODE=production
ALLOW_MOCKS=false
NEXT_PUBLIC_ALLOW_MOCKS=false
```

## 🔐 SUPABASE AUTHENTICATION
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🗄️ DATABASE (MongoDB Atlas)
```
DB_PROVIDER=mongo
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitbear
MONGODB_DB=fitbear
```

## 🤖 AI SERVICES
```
GEMINI_API_KEY=your-gemini-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
```

## 🌐 BASE URL
```
NEXT_PUBLIC_BASE_URL=https://fitbearai.netlify.app
```

## 🏃‍♂️ FEATURE FLAGS
```
NEXT_PUBLIC_ENABLE_VISION_OCR=true
NEXT_PUBLIC_ENABLE_TTS=true
NEXT_PUBLIC_ENABLE_STT=true
```

## 📊 ANALYTICS (Optional)
```
NEXT_PUBLIC_POSTHOG_API_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 🔗 HOW TO GET API KEYS:

### Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API → Copy URL and anon key

### MongoDB Atlas:
1. Go to https://cloud.mongodb.com/
2. Clusters → Connect → Drivers
3. Copy connection string

### Google Gemini:
1. Go to https://aistudio.google.com/app/apikey
2. Create new API key

### Deepgram:
1. Go to https://console.deepgram.com/
2. API Keys → Create new key

---

## ⚠️ CRITICAL NOTES:

1. **ALL variables must be set** - Missing any will cause failures
2. **Exact names required** - Case sensitive, no typos allowed
3. **Production values only** - No test/placeholder values
4. **Redeploy after adding** - Clear cache and redeploy site

---

## 🧪 VERIFICATION:

After setting variables and redeploying, test:
```bash
curl https://fitbearai.netlify.app/api/whoami
```

Should return:
```json
{
  "app_mode": "production",
  "allow_mocks": false,
  "authenticated": false
}
```

**If you get HTML instead of JSON, environment variables are not set correctly.**