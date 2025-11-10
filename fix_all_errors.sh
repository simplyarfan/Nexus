#!/bin/bash

# Fix all TypeScript remnants and parsing errors

echo "Fixing all parsing errors..."

# Fix TypeScript generics in useState, useEffect, etc.
for file in frontend/src/pages/**/*.js; do
  if [ -f "$file" ]; then
    # Remove TypeScript generics like useState<'profile'>
    sed -i '' 's/useState<[^>]*>/useState/g' "$file"
    sed -i '' 's/useRef<[^>]*>/useRef/g' "$file"
    sed -i '' 's/React\.FC<[^>]*>/React.FC/g' "$file"

    # Fix unescaped HTML entities
    sed -i '' "s/&apos;/'/g" "$file"
    sed -i '' "s/&lsquo;/'/g" "$file"
    sed -i '' "s/&rsquo;/'/g" "$file"
    sed -i '' "s/&#39;/'/g" "$file"

    # Fix missing const initializers (const x = )
    sed -i '' 's/const \([a-zA-Z_][a-zA-Z0-9_]*\) =/const \1 =/g' "$file"
  fi
done

# Fix components too
for file in frontend/src/components/**/*.js; do
  if [ -f "$file" ]; then
    sed -i '' 's/useState<[^>]*>/useState/g' "$file"
    sed -i '' 's/useRef<[^>]*>/useRef/g' "$file"
    sed -i '' "s/&apos;/'/g" "$file"
    sed -i '' "s/&lsquo;/'/g" "$file"
    sed -i '' "s/&rsquo;/'/g" "$file"
    sed -i '' "s/&#39;/'/g" "$file"
  fi
done

echo "✅ Fixed TypeScript remnants and HTML entities"
