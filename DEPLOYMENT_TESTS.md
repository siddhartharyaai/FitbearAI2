# 🧪 COMPREHENSIVE DEPLOYMENT SMOKE TESTS

**ZERO TOLERANCE for mocks in production!** Run these tests from your laptop after Netlify deployment.

## SETUP VARIABLES

```bash
# Replace with your actual deployment values
SITE_URL="https://YOUR-SITE.netlify.app"
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"  
SUPABASE_ANON="your-anon-key-here"
TEST_EMAIL="you@example.com"
TEST_PASSWORD="YourStrongPassword123!"
```

---

## ✅ TEST 0: PRODUCTION MODE VERIFICATION

**CRITICAL:** This must pass first - confirms all mocks are DEAD.

```bash
curl -s "$SITE_URL/api/whoami" | jq
```

**EXPECTED RESULT:**
```json
{
  "user": null,
  "authenticated": false,
  "app_mode": "production", 
  "allow_mocks": false
}
```

❌ **FAIL CONDITIONS:**
- `app_mode` != "production"
- `allow_mocks` != false
- Any demo/mock indicators

---

## ✅ TEST 1: EMAIL/PASSWORD AUTHENTICATION

Get a real access token for API testing:

```bash
# Create/login user (works for both new and existing users)
TOKEN=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" | jq -r '.access_token')

echo "✅ Token obtained: ${TOKEN:0:20}..."

# Verify authenticated whoami
curl -s "$SITE_URL/api/whoami" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**EXPECTED RESULT:**
```json
{
  "user": {"email": "you@example.com", ...},
  "authenticated": true,
  "app_mode": "production",
  "allow_mocks": false
}
```

❌ **FAIL CONDITIONS:**
- Token is null/empty  
- `authenticated` != true
- User object missing

---

## ✅ TEST 2: PROFILE CRUD (Real Database Write)

Test MongoDB write operations with authentication:

```bash
# Save profile
curl -s -X PUT "$SITE_URL/api/me/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"TestUser","height_cm":176,"weight_kg":78,"veg_flag":true,"eggetarian_flag":false,"jain_flag":false,"halal_flag":false,"activity_level":"moderate"}' | jq

# Retrieve profile  
curl -s "$SITE_URL/api/me/profile" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**EXPECTED RESULT:**
- Profile data saved and retrieved successfully
- All fields match what was sent

❌ **FAIL CONDITIONS:**
- 401/403 errors (auth failure)
- 5xx errors (database connection issues)
- Data not persisting

---

## ✅ TEST 3: TDEE CALCULATION + TARGETS

```bash
# Calculate TDEE (no auth needed)
curl -s -X POST "$SITE_URL/api/tools/tdee" \
  -H "Content-Type: application/json" \
  -d '{"sex":"male","age":32,"height_cm":176,"weight_kg":78,"activity_level":"moderate"}' | jq

# Save daily targets (requires auth)
curl -s -X PUT "$SITE_URL/api/me/targets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-08-28","kcal_budget":2200,"protein_g":130,"carb_g":220,"fat_g":70}' | jq
```

**EXPECTED RESULT:**
- TDEE calculation returns realistic numbers (1800-3000 kcal range)
- Targets save successfully with all macro values

---

## ✅ TEST 4: MENU SCANNER (Real Gemini Vision OCR)

**CRITICAL:** Must use real image processing, NO mock data!

```bash
# Test with café menu image  
curl -s -X POST "$SITE_URL/api/menu/scan" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@public/test-assets/cafe-menu.jpg" | jq

# Test without image (should return 400 error)
curl -s -X POST "$SITE_URL/api/menu/scan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

**EXPECTED RESULT:**
- Real OCR analysis of menu image
- Realistic food recommendations based on actual image content
- **MUST NOT contain:** "dal tadka", "paneer", "thali" or other mock defaults

❌ **FAIL CONDITIONS:**
- Returns canned mock responses
- Contains dal/paneer/thali text
- No image = 200 response (should be 400)

---

## ✅ TEST 5: MEAL PHOTO ANALYZER (Real Gemini Vision OCR)

```bash
# Analyze pani puri image
curl -s -X POST "$SITE_URL/api/food/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@public/test-assets/pani-puri.jpg" | jq

# Test without image (should return 400 error)  
curl -s -X POST "$SITE_URL/api/food/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

**EXPECTED RESULT:**
- Recognizes pani puri/golgappa elements
- Provides reasonable nutrition estimates
- May ask clarification questions for accuracy

❌ **FAIL CONDITIONS:**
- Returns generic thali/dal responses
- No actual image analysis
- Mock fallback responses

---

## ✅ TEST 6: COACH C LLM (Real Gemini Text)

```bash
curl -s -X POST "$SITE_URL/api/coach/ask" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"I ate idli this morning and going out for dinner—suggest a high-protein, veg dinner under 700 kcal"}' | jq
```

**EXPECTED RESULT:**
- Contextual, personalized response from real LLM
- Specific food recommendations
- Considers user's morning meal and dietary constraints

❌ **FAIL CONDITIONS:**
- Generic/templated responses
- No contextual awareness  
- 5xx errors (API key issues)

---

## ✅ TEST 7: DEEPGRAM TEXT-TO-SPEECH

```bash
curl -s -X POST "$SITE_URL/api/tts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hi there, this is Coach C. Great job completing the deployment tests!"}' \
  -o test-tts.mp3 -D -

# Check file was created and has audio content
file test-tts.mp3
ls -la test-tts.mp3
```

**EXPECTED RESULT:**
- Audio file created successfully
- Headers show `content-type: audio/mpeg`
- File size > 0 bytes

❌ **FAIL CONDITIONS:**
- JSON error response instead of audio
- Empty or corrupt audio file
- Wrong content-type headers

---

## ✅ TEST 8: DEEPGRAM SPEECH-TO-TEXT

First, record a short audio file (2-3 seconds), then:

```bash
# Upload audio for transcription
curl -s -X POST "$SITE_URL/api/stt" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: audio/webm" \
  --data-binary @sample-audio.webm | jq
```

**EXPECTED RESULT:**
```json
{
  "text": "Your spoken words transcribed here"
}
```

❌ **FAIL CONDITIONS:**
- No transcription returned
- Error messages about API keys
- Empty/null text responses

---

## 📊 COMPLETE SUCCESS CRITERIA

**ALL TESTS MUST PASS for production readiness:**

1. ✅ Production mode active (`app_mode: "production"`)
2. ✅ Authentication working (email/password login)
3. ✅ Database writes persisting (profile, targets)  
4. ✅ Real OCR processing (menu + meal photos)
5. ✅ Live LLM responses (Coach C)
6. ✅ Real voice services (TTS + STT)
7. ✅ Zero mock/demo data appearing
8. ✅ Proper error handling (400s for missing data)

---

## 🚨 FAILURE TRIAGE

| Symptom | Cause | Fix |
|---------|-------|-----|
| `app_mode: "demo"` | Environment vars not set | Check Netlify env vars |
| 401/403 on authenticated calls | Supabase token issues | Verify auth settings |
| Mock data in OCR responses | Production guards missing | Check `assertNoMock()` calls |
| 5xx on AI services | Missing API keys | Verify GEMINI_API_KEY, DEEPGRAM_API_KEY |
| Database connection errors | MongoDB config wrong | Check MONGODB_URI and Atlas settings |
| Function timeouts | Large files or slow APIs | Check Netlify function logs |

---

## 🎯 FINAL VALIDATION

```bash
echo "🧪 DEPLOYMENT SMOKE TEST COMPLETE"
echo "✅ Production mode: VERIFIED" 
echo "✅ Authentication: WORKING"
echo "✅ Real AI services: ACTIVE"
echo "✅ Zero mock data: CONFIRMED"
echo ""
echo "🚀 FITBEAR AI IS PRODUCTION READY!"
```

**If ANY test fails, deployment is NOT ready for users!**