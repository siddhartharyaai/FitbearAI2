#!/bin/bash
# Fix @/lib/utils imports in UI components

cd /app/components/ui

# Fix all @/lib/utils imports to use relative paths
find . -name "*.jsx" -o -name "*.tsx" | xargs sed -i 's|@/lib/utils|../../lib/utils|g'

echo "Fixed all @/lib/utils imports in components/ui/"