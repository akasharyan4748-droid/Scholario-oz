#!/usr/bin/env python3
"""
Convert green-filled tab patterns to use shared SegmentedTabs component.

Handles the common pattern found in 8 modules:
  - recruitment, procurement, health-wellness, alumni, hostel,
    event-management, compliance, finance-dashboard/reports

Each has the same structure:
  <button key={t.id} onClick={() => setTab(t.id)}
    className={cn('flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
    tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
    ...)}>
    <Icon className="h-3.5 w-3.5" /> <span>{t.label}</span>
    {badge}
  </button>

Replaced with:
  <SegmentedTabs tabs={TABS.map(...)} value={tab} onValueChange={setTab} />
"""

import re
import os

# Modules to convert (file path relative to project root)
MODULES = [
    'src/components/principal/modules/recruitment/index.tsx',
    'src/components/principal/modules/procurement/index.tsx',
    'src/components/principal/modules/health-wellness/index.tsx',
    'src/components/principal/modules/alumni/index.tsx',
    'src/components/principal/modules/hostel/index.tsx',
    'src/components/principal/modules/event-management/index.tsx',
    'src/components/principal/modules/compliance/index.tsx',
    'src/components/principal/modules/finance-dashboard/reports.tsx',
]

PROJECT = '/home/z/my-project'

for mod_path in MODULES:
    full_path = os.path.join(PROJECT, mod_path)
    if not os.path.exists(full_path):
        print(f"SKIP (not found): {mod_path}")
        continue

    with open(full_path, 'r') as f:
        content = f.read()

    original = content

    # 1. Add import for SegmentedTabs if not already present
    if 'SegmentedTabs' not in content:
        # Find the last import line and add after it
        import_match = re.search(r"(import [^\n]+ from ['\"][^\n]+['\"]\n)(?!import)", content)
        if import_match:
            insert_pos = import_match.end()
            # Determine the relative path to shared/segmented-tabs
            # All these modules are at src/components/principal/modules/<module>/index.tsx
            # So the import path is '../shared/segmented-tabs'
            import_line = "\nimport { SegmentedTabs } from '../shared/segmented-tabs'\n"
            content = content[:insert_pos] + import_line + content[insert_pos:]

    # 2. Find the tab rendering block and replace it
    # Pattern: <div ... className="flex items-center gap-1 ..."> ... {TABS.map((t) => { ... })} ... </div>
    # We need to find the specific pattern and replace the entire block

    # Find the pattern: a div wrapping TABS.map with buttons that have bg-primary
    # Look for the GlassCard or div wrapper around the tabs
    pattern = re.compile(
        r'<div[^>]*>\s*\{[A-Z_]+TABS\.map\(\(t\)[^}]*'
        r'button[^>]*key=\{t\.id\}[^}]*'
        r'tab === t\.id \? \'bg-primary text-primary-foreground[^}]*'
        r'\}\)\}\s*</div>',
        re.DOTALL
    )

    # More flexible: find the entire block from the opening div to closing div
    # that contains the tab mapping
    # Let's use a simpler approach: find the button-based tab block and replace

    # Find: <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
    # ... {TABS.map((t) => { const Icon = t.icon ... button ... })}
    # </div>

    # Actually, let's find the wrapping element that contains the tabs
    # and replace the entire inner content

    # Pattern varies slightly per module. Let's find the common structure:
    # 1. A container div or GlassCard
    # 2. Inside: {TABS.map((t) => { const Icon = t.icon; ... button ... })}

    # Find TABS.map block
    tabs_map_pattern = re.compile(
        r'\{([A-Z_]+TABS)\.map\(\(t\)\s*=>\s*\{[^}]*'
        r'const Icon = t\.icon[^}]*'
        r'tab === t\.id[^}]*'
        r'bg-primary text-primary-foreground[^}]*'
        r'\}\)\}',
        re.DOTALL
    )

    match = tabs_map_pattern.search(content)
    if not match:
        # Try alternate variable name (some use 'tabs' instead of 'TABS')
        tabs_map_pattern = re.compile(
            r'\{(tabs)\.map\(\(t\)\s*=>\s*\{[^}]*'
            r'const Icon = t\.icon[^}]*'
            r'tab === t\.id[^}]*'
            r'bg-primary text-primary-foreground[^}]*'
            r'\}\)\}',
            re.DOTALL
        )
        match = tabs_map_pattern.search(content)

    if match:
        tabs_var = match.group(1)
        # Find the wrapping element (div or GlassCard) around this block
        # Search backwards from the match for the opening tag
        start = match.start()
        # Look for the opening div/GlassCard before this
        before = content[:start]
        # Find the last opening tag that's not closed before our position
        wrapper_match = re.search(r'(<(?:div|GlassCard)[^>]*>)\s*$', before.rstrip())
        if wrapper_match:
            wrapper_start = wrapper_match.start()
            # Find the closing tag after our match
            after = content[match.end():]
            close_match = re.search(r'</(?:div|GlassCard)>', after)
            if close_match:
                wrapper_end = match.end() + close_match.end()

                # Build the replacement
                replacement = f'<SegmentedTabs tabs={{{tabs_var}.map((t) => ({{ value: t.id, label: t.label, icon: t.icon }})))}} value={{tab}} onValueChange={{setTab}} />'

                content = content[:wrapper_start] + replacement + content[wrapper_end:]
                print(f"CONVERTED: {mod_path}")
            else:
                print(f"SKIP (no closing tag): {mod_path}")
        else:
            print(f"SKIP (no wrapper): {mod_path}")
    else:
        print(f"SKIP (no TABS.map pattern): {mod_path}")

    if content != original:
        with open(full_path, 'w') as f:
            f.write(content)

print("\nDone.")
