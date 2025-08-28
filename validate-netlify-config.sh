#!/bin/bash
# Netlify Configuration Validator

set -e

echo "🔍 NETLIFY CONFIGURATION VALIDATOR"
echo "=================================="

CONFIG_FILE="netlify.toml"

# Check if file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ netlify.toml not found"
    exit 1
fi

echo "✅ netlify.toml found"

# Check for common syntax issues
echo ""
echo "🧹 CHECKING SYNTAX ISSUES..."

# Check for proper TOML format
if grep -q "^\[build\]" "$CONFIG_FILE"; then
    echo "✅ Build section present"
else
    echo "❌ Missing [build] section"
    exit 1
fi

if grep -q "^\[\[plugins\]\]" "$CONFIG_FILE"; then
    echo "✅ Plugins section properly formatted"
else
    echo "❌ Plugins section missing or malformed"
    exit 1
fi

# Check for valid Node version
if grep -q 'NODE_VERSION.*=.*"[0-9][0-9]*\.[0-9][0-9]*\.[0-9]' "$CONFIG_FILE"; then
    echo "✅ Valid Node version format"
else
    echo "❌ Invalid Node version format"
    exit 1
fi

# Check for proper array syntax in external_node_modules
if grep -A 10 "external_node_modules" "$CONFIG_FILE" | grep -q '^\s*".*",$'; then
    echo "✅ External modules array properly formatted"
else
    echo "❌ External modules array syntax issue"
fi

# Check for invalid function names (wildcards not supported)
if grep -q '\[functions\.".*\*.*"\]' "$CONFIG_FILE"; then
    echo "❌ Invalid function name with wildcards found"
    exit 1
else
    echo "✅ No wildcard function names found"
fi

echo ""
echo "📋 CONFIGURATION SUMMARY:"
echo "========================"

# Extract key configuration values
echo "Node Version: $(grep NODE_VERSION "$CONFIG_FILE" | cut -d'"' -f2)"
echo "Build Command: $(grep 'command.*=' "$CONFIG_FILE" | cut -d'"' -f2)"
echo "Publish Dir: $(grep 'publish.*=' "$CONFIG_FILE" | cut -d'"' -f2)"
echo "Plugin Count: $(grep -c '\[\[plugins\]\]' "$CONFIG_FILE")"
echo "External Modules: $(grep -A 20 'external_node_modules' "$CONFIG_FILE" | grep -c '".*"' || echo "0")"

echo ""
echo "✅ NETLIFY CONFIGURATION VALIDATION PASSED!"
echo "Ready for deployment to Netlify"