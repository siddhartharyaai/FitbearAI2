#!/bin/bash
# 🔍 PRE-DEPLOYMENT VALIDATION SCRIPT
# Ensures zero tolerance for mock data before Netlify deployment

set -e  # Exit on any error

echo "🔍 FITBEAR AI PRODUCTION VALIDATION"
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to print results
print_check() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

echo ""
echo "🧹 CHECKING FOR MOCK DATA CONTAMINATION..."

# Check for mock data in active API routes (not backup files)
MOCK_FILES=$(find app/api -name "*.ts" -o -name "*.js" | grep -v backup | xargs grep -l -E "(dal tadka|paneer tikka|thali|demo.*food)" 2>/dev/null || true)
if [ -n "$MOCK_FILES" ]; then
    echo -e "${RED}❌ Found mock data in active API routes:${NC}"
    echo "$MOCK_FILES"
    ERRORS=$((ERRORS + 1))
else
    print_check "No mock food data in active API routes" 0
fi

# Check that production guards are in place
GUARD_FILES=$(find app/api -name "*.ts" -o -name "*.js" | grep -v backup | xargs grep -l "assertNoMock" 2>/dev/null || true)
if [ -n "$GUARD_FILES" ]; then
    print_check "Production guards (assertNoMock) present in API routes" 0
else
    echo -e "${RED}❌ Missing production guards in API routes${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🔧 CHECKING BUILD CONFIGURATION..."

# Check netlify.toml exists
if [ -f "netlify.toml" ]; then
    print_check "netlify.toml exists" 0
    
    # Check for required netlify.toml settings
    if grep -q "@netlify/plugin-nextjs" netlify.toml; then
        print_check "Next.js plugin configured" 0
    else
        print_check "Next.js plugin configured" 1
    fi
    
    if grep -q "node_bundler.*esbuild" netlify.toml; then
        print_check "ESBuild bundler configured" 0
    else
        print_check "ESBuild bundler configured" 1
    fi
else
    print_check "netlify.toml exists" 1
fi

# Check package.json build script
if grep -q '"build".*"next build"' package.json; then
    print_check "Build script configured" 0
else
    print_check "Build script configured" 1
fi

echo ""
echo "📝 CHECKING ESSENTIAL FILES..."

# Check critical files exist
CRITICAL_FILES=("app/page.js" "app/layout.js" "app/profile/page.tsx" "lib/auth.ts" "lib/mode.js")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_check "$file exists" 0
    else
        print_check "$file exists" 1
    fi
done

# Check for .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "node_modules" .gitignore && grep -q ".next" .gitignore; then
        print_check ".gitignore properly configured" 0
    else
        print_check ".gitignore properly configured" 1
    fi
else
    print_check ".gitignore exists" 1
fi

echo ""
echo "🏗️  TESTING BUILD PROCESS..."

# Test build
echo "Running yarn install && yarn build..."
if yarn install --silent && yarn build > build.log 2>&1; then
    print_check "Build successful" 0
    rm -f build.log
else
    print_check "Build successful" 1
    echo -e "${YELLOW}Build log:${NC}"
    cat build.log
    rm -f build.log
fi

echo ""
echo "🔍 CHECKING DEPLOYED ASSETS..."

# Check if test assets exist for smoke tests
if [ -f "public/test-assets/cafe-menu.jpg" ] && [ -f "public/test-assets/pani-puri.jpg" ]; then
    print_check "Test assets present for smoke testing" 0
else
    print_check "Test assets present for smoke testing" 1
fi

echo ""
echo "📊 VALIDATION SUMMARY"
echo "===================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Netlify with environment variables"
    echo "2. Run deployment smoke tests from DEPLOYMENT_TESTS.md"
    echo "3. Verify zero mock data in production"
    exit 0
else
    echo -e "${RED}❌ $ERRORS ERROR(S) FOUND - DEPLOYMENT BLOCKED!${NC}"
    echo ""
    echo "Fix all errors above before deploying to production."
    exit 1
fi