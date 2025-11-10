#!/usr/bin/env python3
import re
import os

files_to_fix = [
    'frontend/src/pages/admin/system.js',
    'frontend/src/pages/admin/tickets.js',
    'frontend/src/pages/admin/users.js',
    'frontend/src/pages/admin/index.js',
    'frontend/src/pages/superadmin.js',
    'frontend/src/pages/auth/reset-password.js',
    'frontend/src/pages/auth/verify-2fa.js',
    'frontend/src/pages/cv-intelligence.js',
    'frontend/src/pages/interview-coordinator.js',
    'frontend/src/pages/profile.js',
    'frontend/src/pages/support/create-ticket.js',
    'frontend/src/pages/support/ticket/[id].js',
]

# Fix unescaped entities
entity_files = [
    'frontend/src/pages/auth/forgot-password.js',
    'frontend/src/pages/auth/verify-email.js',
    'frontend/src/pages/auth/register.js',
]

def fix_entities(file_path):
    """Fix unescaped HTML entities"""
    if not os.path.exists(file_path):
        print(f"  ⚠️  File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace unescaped apostrophes in strings
    replacements = [
        ("don't", "don&apos;t"),
        ("Don't", "Don&apos;t"),
        ("you're", "you&apos;re"),
        ("You're", "You&apos;re"),
        ("we'll", "we&apos;ll"),
        ("We'll", "We&apos;ll"),
        ("it's", "it&apos;s"),
        ("It's", "It&apos;s"),
        ("you'll", "you&apos;ll"),
        ("You'll", "You&apos;ll"),
        ("haven't", "haven&apos;t"),
        ("Haven't", "Haven&apos;t"),
        ("doesn't", "doesn&apos;t"),
        ("Doesn't", "Doesn&apos;t"),
        ("Let's", "Let&apos;s"),
        ("let's", "let&apos;s"),
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✅ Fixed entities in {os.path.basename(file_path)}")

def fix_jsx_fragments(file_path):
    """Fix common JSX fragment issues"""
    if not os.path.exists(file_path):
        print(f"  ⚠️  File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern 1: Fix </button> followed by <h1> without wrapper
    pattern1 = r'(</button>)\s*\n\s*<h1'
    if re.search(pattern1, content):
        content = re.sub(
            r'(</button>)\s*\n\s*(<h1.*?</h1>)\s*\n\s*(<p.*?</p>)\s*\n\s*(</div>)',
            r'\1\n            <div>\n              \2\n              \3\n            </div>\n          \4',
            content
        )
        print(f"  ✅ Fixed JSX fragments (pattern 1) in {os.path.basename(file_path)}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("🔧 Fixing parsing errors...\n")

print("1. Fixing unescaped HTML entities:")
for file_path in entity_files:
    fix_entities(file_path)

print("\n2. Fixing JSX fragment issues:")
for file_path in files_to_fix:
    fix_jsx_fragments(file_path)

print("\n✅ All fixes applied!")
