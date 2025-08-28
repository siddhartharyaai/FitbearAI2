#!/usr/bin/env python3
"""
🎯 FINAL VALIDATION - ALL SYSTEMS GO CHECK
Comprehensive backend testing for Fitbear AI before Netlify redeployment

Testing Priority:
1. Supabase Authentication - Verify real credentials working
2. Gemini AI Integration - Test Coach Chat and Menu Scanner with updated API key  
3. Core Backend APIs - Health check, TDEE, Profile/Targets
4. Production Readiness - No mocks, proper error handling
"""

import requests
import json
import time
import base64
from io import BytesIO
import os
import subprocess

# Load environment variables from .env file
def load_env():
    try:
        result = subprocess.run(['cat', '/app/.env'], capture_output=True, text=True)
        env_vars = {}
        for line in result.stdout.strip().split('\n'):
            if '=' in line and not line.startswith('#'):
                key, value = line.split('=', 1)
                env_vars[key] = value
        return env_vars
    except:
        return {}

env_vars = load_env()

# Test both local and external URLs
EXTERNAL_URL = env_vars.get('NEXT_PUBLIC_BASE_URL', 'https://fitbear-ai.preview.emergentagent.com')
LOCAL_URL = 'http://localhost:3000'

# Start with local testing
API_BASE = f"{LOCAL_URL}/api"

print(f"🎯 FINAL VALIDATION - ALL SYSTEMS GO CHECK")
print(f"Testing backend locally at: {API_BASE}")
print(f"External URL: {EXTERNAL_URL}")
print(f"Environment: {env_vars.get('APP_MODE', 'unknown')}")
print("=" * 80)

def test_endpoint(method, endpoint, data=None, files=None, headers=None):
    """Test an API endpoint and return response details"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        start_time = time.time()
        
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == 'POST':
            if files:
                response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
            else:
                response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, headers=headers, timeout=30)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        duration = time.time() - start_time
        
        # Try to parse JSON response
        try:
            response_data = response.json()
        except:
            response_data = {"raw_response": response.text[:500]}
        
        return {
            "status_code": response.status_code,
            "duration": round(duration, 2),
            "response": response_data,
            "success": 200 <= response.status_code < 300
        }
        
    except requests.exceptions.Timeout:
        return {"error": "Request timeout (30s)", "success": False}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection error - service may be down", "success": False}
    except Exception as e:
        return {"error": f"Request failed: {str(e)}", "success": False}

def create_test_image():
    """Create a simple test image for upload endpoints"""
    # Create a minimal PNG image (1x1 pixel)
    png_data = base64.b64decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    )
    return BytesIO(png_data)

# Test Results Storage
results = {
    "authentication": {},
    "ai_integration": {},
    "core_apis": {},
    "production_readiness": {},
    "summary": {"total": 0, "passed": 0, "failed": 0}
}

print("\n🔐 1. SUPABASE AUTHENTICATION TESTING")
print("-" * 50)

# Test whoami endpoint (authentication context)
print("Testing whoami endpoint...")
whoami_result = test_endpoint('GET', '/whoami')
results["authentication"]["whoami"] = whoami_result

if whoami_result.get("success"):
    print(f"✅ Whoami: {whoami_result['status_code']} - {whoami_result['duration']}s")
    if "production" in str(whoami_result.get("response", {})).lower():
        print("✅ Production mode confirmed")
    else:
        print("⚠️ Production mode not clearly indicated")
else:
    print(f"❌ Whoami: {whoami_result.get('error', 'Failed')}")

print("\n🤖 2. GEMINI AI INTEGRATION TESTING")
print("-" * 50)

# Test Coach Chat endpoint
print("Testing Coach Chat with Gemini AI...")
coach_data = {
    "message": "I'm a 25-year-old vegetarian looking to gain muscle. What Indian foods should I eat for protein?"
}
coach_result = test_endpoint('POST', '/coach/ask', coach_data)
results["ai_integration"]["coach_chat"] = coach_result

if coach_result.get("success"):
    response_text = coach_result.get("response", {}).get("response", "")
    print(f"✅ Coach Chat: {coach_result['status_code']} - {coach_result['duration']}s")
    print(f"✅ Response length: {len(response_text)} characters")
    if len(response_text) > 100:
        print("✅ Detailed AI response received")
    else:
        print("⚠️ Short AI response - may indicate issues")
else:
    print(f"❌ Coach Chat: {coach_result.get('error', 'Failed')}")

# Test Menu Scanner endpoint
print("\nTesting Menu Scanner with Gemini Vision...")
try:
    test_image = create_test_image()
    files = {'image': ('test.png', test_image, 'image/png')}
    menu_result = test_endpoint('POST', '/menu/scan', files=files)
    results["ai_integration"]["menu_scanner"] = menu_result
    
    if menu_result.get("success"):
        print(f"✅ Menu Scanner: {menu_result['status_code']} - {menu_result['duration']}s")
        response = menu_result.get("response", {})
        if "items" in response or "recommendations" in response:
            print("✅ Menu analysis response received")
        else:
            print("⚠️ Unexpected menu scanner response format")
    else:
        print(f"❌ Menu Scanner: {menu_result.get('error', 'Failed')}")
except Exception as e:
    print(f"❌ Menu Scanner: Image upload failed - {str(e)}")
    results["ai_integration"]["menu_scanner"] = {"error": str(e), "success": False}

print("\n🏥 3. CORE BACKEND APIs TESTING")
print("-" * 50)

# Test API Health Check
print("Testing API Health Check...")
health_result = test_endpoint('GET', '/health/app')
results["core_apis"]["health_check"] = health_result

if health_result.get("success"):
    print(f"✅ Health Check: {health_result['status_code']} - {health_result['duration']}s")
    response = health_result.get("response", {})
    if "status" in response or "message" in response:
        print("✅ Health check response valid")
else:
    print(f"❌ Health Check: {health_result.get('error', 'Failed')}")

# Test TDEE Calculator
print("\nTesting TDEE Calculator...")
tdee_data = {
    "sex": "male",
    "age": 28,
    "height_cm": 175,
    "weight_kg": 70,
    "activity_level": "moderate"
}
tdee_result = test_endpoint('POST', '/tools/tdee', tdee_data)
results["core_apis"]["tdee_calculator"] = tdee_result

if tdee_result.get("success"):
    tdee_value = tdee_result.get("response", {}).get("tdee", 0)
    print(f"✅ TDEE Calculator: {tdee_result['status_code']} - {tdee_result['duration']}s")
    print(f"✅ TDEE calculated: {tdee_value} kcal")
    if 2200 <= tdee_value <= 2800:
        print("✅ TDEE value in expected range")
    else:
        print(f"⚠️ TDEE value {tdee_value} outside expected range (2200-2800)")
else:
    print(f"❌ TDEE Calculator: {tdee_result.get('error', 'Failed')}")

# Test Profile Endpoints
print("\nTesting Profile Endpoints...")
profile_get_result = test_endpoint('GET', '/me/profile')
results["core_apis"]["profile_get"] = profile_get_result

if profile_get_result.get("success"):
    print(f"✅ Profile GET: {profile_get_result['status_code']} - {profile_get_result['duration']}s")
else:
    print(f"❌ Profile GET: {profile_get_result.get('error', 'Failed')}")

# Test Targets Endpoints
print("\nTesting Targets Endpoints...")
targets_get_result = test_endpoint('GET', '/me/targets')
results["core_apis"]["targets_get"] = targets_get_result

if targets_get_result.get("success"):
    print(f"✅ Targets GET: {targets_get_result['status_code']} - {targets_get_result['duration']}s")
    targets = targets_get_result.get("response", {})
    if "tdee" in targets or "calories" in targets:
        print("✅ Targets data structure valid")
else:
    print(f"❌ Targets GET: {targets_get_result.get('error', 'Failed')}")

print("\n🛡️ 4. PRODUCTION READINESS TESTING")
print("-" * 50)

# Test Production Mode Enforcement
print("Testing production mode enforcement...")
production_checks = {
    "app_mode": env_vars.get('APP_MODE') == 'production',
    "allow_mocks": env_vars.get('ALLOW_MOCKS') == 'false',
    "supabase_real": 'rencenlauvvopjjynvebc' in str(env_vars.get('SUPABASE_URL', '')),
    "gemini_key_set": len(env_vars.get('GEMINI_API_KEY', '')) > 30
}

results["production_readiness"]["environment"] = production_checks

for check, status in production_checks.items():
    if status:
        print(f"✅ {check}: Configured correctly")
    else:
        print(f"❌ {check}: Not properly configured")

# Test Food Analyzer (additional AI endpoint)
print("\nTesting Food Analyzer...")
try:
    test_image = create_test_image()
    files = {'image': ('meal.png', test_image, 'image/png')}
    food_result = test_endpoint('POST', '/food/analyze', files=files)
    results["ai_integration"]["food_analyzer"] = food_result
    
    if food_result.get("success"):
        print(f"✅ Food Analyzer: {food_result['status_code']} - {food_result['duration']}s")
    else:
        print(f"❌ Food Analyzer: {food_result.get('error', 'Failed')}")
except Exception as e:
    print(f"❌ Food Analyzer: {str(e)}")
    results["ai_integration"]["food_analyzer"] = {"error": str(e), "success": False}

print("\n" + "=" * 80)
print("📊 FINAL VALIDATION SUMMARY")
print("=" * 80)

# Calculate summary statistics
total_tests = 0
passed_tests = 0

for category, tests in results.items():
    if category == "summary":
        continue
    
    print(f"\n{category.upper().replace('_', ' ')}:")
    for test_name, result in tests.items():
        total_tests += 1
        if isinstance(result, dict) and result.get("success"):
            passed_tests += 1
            print(f"  ✅ {test_name}")
        else:
            print(f"  ❌ {test_name}")

results["summary"] = {
    "total": total_tests,
    "passed": passed_tests,
    "failed": total_tests - passed_tests,
    "success_rate": round((passed_tests / total_tests) * 100, 1) if total_tests > 0 else 0
}

print(f"\n🎯 OVERALL RESULTS:")
print(f"Total Tests: {total_tests}")
print(f"Passed: {passed_tests}")
print(f"Failed: {total_tests - passed_tests}")
print(f"Success Rate: {results['summary']['success_rate']}%")

if results["summary"]["success_rate"] >= 80:
    print("\n🎉 VALIDATION SUCCESSFUL - READY FOR NETLIFY DEPLOYMENT!")
elif results["summary"]["success_rate"] >= 60:
    print("\n⚠️ PARTIAL SUCCESS - SOME ISSUES NEED ATTENTION")
else:
    print("\n🚨 VALIDATION FAILED - CRITICAL ISSUES DETECTED")

print("\n🔍 DETAILED RESULTS:")
print(json.dumps(results, indent=2))