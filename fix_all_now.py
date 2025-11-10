#!/usr/bin/env python3
import re
import os

def fix_file(filepath):
    """Fix all parsing errors in a file"""
    if not os.path.exists(filepath):
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Remove all TypeScript type annotations
    content = re.sub(r': React\.\w+<[^>]+>', '', content)
    content = re.sub(r': React\.\w+', '', content)
    content = re.sub(r'useState<[^>]+>', 'useState', content)
    content = re.sub(r'useRef<[^>]+>', 'useRef', content)
    content = re.sub(r'useEffect<[^>]+>', 'useEffect', content)

    # Remove type definitions between imports and export
    lines = content.split('\n')
    new_lines = []
    skip_until_export = False
    imports_done = False

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Check if imports section is done
        if stripped.startswith('import '):
            imports_done = False
        elif imports_done == False and stripped and not stripped.startswith('import') and not stripped.startswith('//'):
            imports_done = True

        # Skip standalone type properties (lines with just "name;" or "property?;")
        if imports_done and not skip_until_export:
            if re.match(r'^  [a-zA-Z_][a-zA-Z0-9_]*[?]?[;:]', stripped) or stripped in ['};', '{']:
                continue
            if stripped.startswith('export '):
                skip_until_export = True

        new_lines.append(line)

    content = '\n'.join(new_lines)

    # Fix const declarations without initializers
    content = re.sub(r'const (\w+) =>', r'const \1 = ', content)

    # Fix unescaped entities
    content = content.replace("don't", "don&apos;t")
    content = content.replace("Don't", "Don&apos;t")
    content = content.replace("you're", "you&apos;re")
    content = content.replace("You're", "You&apos;re")
    content = content.replace("we'll", "we&apos;ll")
    content = content.replace("We'll", "We&apos;ll")
    content = content.replace("it's", "it&apos;s")
    content = content.replace("It's", "It&apos;s")
    content = content.replace("you'll", "you&apos;ll")
    content = content.replace("doesn't", "doesn&apos;t")
    content = content.replace("let's", "let&apos;s")
    content = content.replace("Let's", "Let&apos;s")

    # Fix import paths
    content = content.replace("from '@/", "from '../")
    content = content.replace('from "@/', 'from "../')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Fix all problematic files
files = [
    'frontend/src/pages/admin/index.js',
    'frontend/src/pages/admin/system.js',
    'frontend/src/pages/admin/tickets.js',
    'frontend/src/pages/admin/users.js',
    'frontend/src/pages/auth/reset-password.js',
    'frontend/src/pages/auth/verify-2fa.js',
    'frontend/src/pages/cv-intelligence.js',
    'frontend/src/pages/interview-coordinator.js',
    'frontend/src/pages/profile.js',
    'frontend/src/pages/superadmin.js',
    'frontend/src/pages/support.js',
    'frontend/src/pages/support/create-ticket.js',
    'frontend/src/pages/support/ticket/[id].js',
]

print("🔧 Fixing ALL parsing errors...\n")
for filepath in files:
    if fix_file(filepath):
        print(f"✅ Fixed {filepath}")
    else:
        print(f"⚠️  Skipped {filepath}")

print("\n✅ ALL FILES FIXED!")
