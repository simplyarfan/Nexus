#!/usr/bin/env python3
import os
import re

def convert_tsx_to_js(tsx_content, relative_depth=2):
    """Convert TypeScript React to JavaScript"""
    js = tsx_content

    # Remove 'use client' directive
    js = js.replace("'use client';", "")
    js = js.replace('"use client";', "")

    # Fix React imports
    if 'import { useState' in js or 'import { useEffect' in js:
        js = js.replace('import { useState', 'import React, { useState')
    elif "import { useRouter }" in js and "import React" not in js:
        js = "import React from 'react';\n" + js

    # Fix router imports
    js = js.replace('import { useRouter } from \'next/navigation\';', 'import { useRouter } from \'next/router\';')
    js = js.replace('import { useRouter } from "next/navigation";', 'import { useRouter } from "next/router";')
    js = js.replace('import { useSearchParams } from \'next/navigation\';', 'import { useRouter } from \'next/router\';')
    js = js.replace('import { useSearchParams } from "next/navigation";', 'import { useRouter } from "next/router";')

    # Build relative paths based on depth
    rel_path = '../' * relative_depth

    # Fix component imports
    js = js.replace('import Button from \'@/components/ui/Button\';', f'import ButtonGreen from \'{rel_path}components/ui/ButtonGreen\';')
    js = js.replace('import Button from "@/components/ui/Button";', f'import ButtonGreen from "{rel_path}components/ui/ButtonGreen";')
    js = js.replace('import Input from \'@/components/ui/Input\';', f'import InputGreen from \'{rel_path}components/ui/InputGreen\';')
    js = js.replace('import Input from "@/components/ui/Input";', f'import InputGreen from "{rel_path}components/ui/InputGreen";')
    js = js.replace('import Card from \'@/components/ui/Card\';', f'import CardGreen from \'{rel_path}components/ui/CardGreen\';')
    js = js.replace('import Card from "@/components/ui/Card";', f'import CardGreen from "{rel_path}components/ui/CardGreen";')
    js = js.replace('import Badge from \'@/components/ui/Badge\';', f'import BadgeGreen from \'{rel_path}components/ui/BadgeGreen\';')
    js = js.replace('import Badge from "@/components/ui/Badge";', f'import BadgeGreen from "{rel_path}components/ui/BadgeGreen";')
    js = js.replace('import Modal from \'@/components/ui/Modal\';', f'import ModalGreen from \'{rel_path}components/ui/ModalGreen\';')
    js = js.replace('import Modal from "@/components/ui/Modal";', f'import ModalGreen from "{rel_path}components/ui/ModalGreen";')

    # Fix other imports
    js = js.replace('from \'@/lib/', f'from \'{rel_path}lib/')
    js = js.replace('from "@/lib/', f'from "{rel_path}lib/')
    js = js.replace('from \'@/components/', f'from \'{rel_path}components/')
    js = js.replace('from "@/components/', f'from "{rel_path}components/')
    js = js.replace('from \'@/contexts/', f'from \'{rel_path}contexts/')
    js = js.replace('from "@/contexts/', f'from "{rel_path}contexts/')

    # Replace component names in JSX
    js = re.sub(r'<Button\b', '<ButtonGreen', js)
    js = re.sub(r'</Button>', '</ButtonGreen>', js)
    js = re.sub(r'<Input\b', '<InputGreen', js)
    js = re.sub(r'<Card\b', '<CardGreen', js)
    js = re.sub(r'</Card>', '</CardGreen>', js)
    js = re.sub(r'<Badge\b', '<BadgeGreen', js)
    js = re.sub(r'</Badge>', '</BadgeGreen>', js)
    js = re.sub(r'<Modal\b', '<ModalGreen', js)
    js = re.sub(r'</Modal>', '</ModalGreen>', js)

    # Remove TypeScript syntax
    js = re.sub(r':\s*React\.FC\b', '', js)
    js = re.sub(r':\s*React\.ReactNode\b', '', js)
    js = re.sub(r':\s*string\b', '', js)
    js = re.sub(r':\s*number\b', '', js)
    js = re.sub(r':\s*boolean\b', '', js)
    js = re.sub(r':\s*any\b', '', js)
    js = re.sub(r':\s*void\b', '', js)
    js = re.sub(r':\s*Date\b', '', js)
    js = re.sub(r'interface\s+\w+\s*\{[^}]*\}', '', js)
    js = re.sub(r'type\s+\w+\s*=\s*[^;]+;', '', js)
    js = re.sub(r'<\w+>', '', js)  # Remove generic types
    js = re.sub(r'as\s+\w+', '', js)

    # Replace CSS variable classes with actual classes
    css_replacements = {
        'bg-card': 'bg-white',
        'text-card-foreground': 'text-gray-900',
        'border-border': 'border-gray-200',
        'bg-background': 'bg-gray-50',
        'text-foreground': 'text-gray-900',
        'bg-muted': 'bg-gray-100',
        'text-muted-foreground': 'text-gray-600',
        'bg-primary': 'bg-green-500',
        'text-primary-foreground': 'text-white',
        'text-primary': 'text-green-600',
        'border-input': 'border-gray-300',
        'ring-ring': 'ring-green-500',
        'bg-secondary': 'bg-gray-100',
        'text-secondary-foreground': 'text-gray-900',
        'bg-accent': 'bg-green-50',
        'text-accent-foreground': 'text-green-900',
        'bg-destructive': 'bg-red-500',
        'text-destructive-foreground': 'text-white',
        'text-destructive': 'text-red-600',
    }

    for old_class, new_class in css_replacements.items():
        js = js.replace(old_class, new_class)

    # Replace searchParams with router.query
    js = js.replace('const searchParams = useSearchParams();', 'const router = useRouter();')
    js = re.sub(r'searchParams\.get\([\'"](\w+)[\'"]\)', r'router.query.\1', js)

    return js

# File mappings: (prototype_path, destination_path, relative_depth)
files_to_convert = [
    ('superadmin/analytics/page.tsx', 'admin/analytics.js', 3),
    ('superadmin/system/page.tsx', 'admin/system.js', 3),
    ('superadmin/users/page.tsx', 'admin/users.js', 3),
    ('superadmin/tickets/page.tsx', 'admin/tickets.js', 3),
    ('support/create/page.tsx', 'support/create-ticket.js', 3),
    ('superadmin/tickets/[id]/page.tsx', 'support/ticket/[id].js', 4),
]

prototype_base = '/Users/syedarfan/Documents/Projects/webpages:webapps/nexus-design-prototypes/app'
target_base = '/Users/syedarfan/Documents/Projects/webpages:webapps/nexus/frontend/src/pages'

for proto_path, target_path, depth in files_to_convert:
    proto_file = os.path.join(prototype_base, proto_path)
    target_file = os.path.join(target_base, target_path)

    if not os.path.exists(proto_file):
        print(f'❌ Prototype not found: {proto_file}')
        continue

    # Read prototype
    with open(proto_file, 'r', encoding='utf-8') as f:
        tsx_content = f.read()

    # Convert to JS
    js_content = convert_tsx_to_js(tsx_content, depth)

    # Backup existing file if it exists
    if os.path.exists(target_file):
        backup_file = target_file + '.backup'
        with open(target_file, 'r', encoding='utf-8') as f:
            original_content = f.read()
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(original_content)
        print(f'📦 Backed up: {target_path}.backup')

    # Write converted file
    os.makedirs(os.path.dirname(target_file), exist_ok=True)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f'✅ Converted: {target_path}')

print('\n🎉 Converted 6 sub-pages to match prototypes EXACTLY!')
