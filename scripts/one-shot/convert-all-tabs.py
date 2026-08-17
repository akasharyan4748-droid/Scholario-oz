#!/usr/bin/env python3
"""
Convert all modules from green-filled tabs to shared SegmentedTabs component.
Handles modules with inline tab arrays and modules with imported tab data.
"""

import re
import os

PROJECT = '/home/z/my-project'
BASE = f'{PROJECT}/src/components/principal/modules'

# Modules with INLINE tab arrays (icons are JSX, defined right in the render)
INLINE_MODULES = {
    'recruitment/index.tsx': {
        'tabs': [
            ("postings", "Job Postings", "Briefcase", "jobPostings.length"),
            ("candidates", "Candidates", "Users", "candidates.length"),
            ("interviews", "Interviews", "Calendar", "interviews.length"),
        ],
        'icons_imported': 'UserPlus, Briefcase, Users, Calendar, Clock, Plus',
    },
    'procurement/index.tsx': {
        'tabs': [
            ("vendors", "Vendors", "Truck", "vendors.length"),
            ("orders", "Purchase Orders", "FileText", "purchaseOrders.length"),
            ("receipts", "Goods Receipts", "Package", "goodsReceipts.length"),
        ],
        'icons_imported': 'Truck, FileText, Package, Plus',
    },
    'hostel/index.tsx': {
        'tabs': [
            ("blocks", "Hostel Blocks", "Building2", "hostelBlocks.length"),
            ("rooms", "Rooms", "BedDouble", "hostelRooms.length"),
            ("mess", "Mess & Dining", "UtensilsCrossed", None),
        ],
        'icons_imported': 'Building2, BedDouble, UtensilsCrossed, Users, IndianRupee, Star, Plus',
    },
    'event-management/index.tsx': {
        'tabs': [
            ("events", "Events", "CalendarDays", "events.length"),
            ("tasks", "Tasks", "ListChecks", "eventTasks.length"),
            ("gallery", "Gallery", "ImageIcon", "eventGallery.length"),
        ],
        'icons_imported': 'CalendarDays, Plus, Users, Clock, IndianRupee, ListChecks, Image as ImageIcon',
    },
    'compliance/index.tsx': {
        'tabs': [
            ("compliance", "Compliance Items", "ShieldCheck", "complianceItems.length"),
            ("audits", "Audit Log", "FileCheck", "auditLogs.length"),
            ("documents", "Documents", "FileText", "complianceDocuments.length"),
        ],
        'icons_imported': 'ShieldCheck, FileCheck, AlertTriangle, Star, Plus, FileText, CheckCircle2',
    },
}

# Modules where tabs array is defined as a module-level const inside the component
COMPONENT_LEVEL_MODULES = {
    'alumni/index.tsx': {
        'tabs': [
            ("directory", "Alumni Directory", "Users", "alumni.length"),
            ("donations", "Donations", "Heart", "alumni.length"),
            ("reunions", "Reunions", "CalendarDays", "alumni.length"),
        ],
        'icons_imported': 'Users, Heart, CalendarDays, TrendingUp, GraduationCap, Send',
    },
}

# Modules where tabs are imported from a data file
DATA_FILE_MODULES = {
    'health-wellness/index.tsx': {
        'data_file': 'health-wellness/data.tsx',
        'tabs_var': 'tabs',
        'tab_type': 'Tab',
    },
    'finance-dashboard/reports.tsx': {
        'data_file': 'finance-dashboard/data.tsx',
        'tabs_var': 'statementTabs',
        'tab_type': 'Tab',
    },
}

# Admission StatusTabs
ADMISSION_STATUS_TABS = 'admission/components/dashboard/StatusTabs.tsx'


def build_segmented_tabs_jsx(tabs_data, indent='      '):
    """Build the SegmentedTabs JSX from tab data."""
    tabs_str = ',\n'.join([
        f"        {{ value: '{val}', label: '{label}', icon: <{icon} className=\"h-3.5 w-3.5\" />{f', badge: {count}' if count else ''} }}"
        for val, label, icon, count in tabs_data
    ])
    return f"""<SegmentedTabs
      tabs={[
{tabs_str}
      ]}
      value={{tab}}
      onValueChange={{setTab}}
    />"""


def convert_inline_module(filepath, config):
    """Convert a module with inline tab array."""
    full_path = os.path.join(BASE, filepath)
    with open(full_path, 'r') as f:
        content = f.read()
    original = content

    # Build the replacement SegmentedTabs JSX
    replacement = build_segmented_tabs_jsx(config['tabs'])

    # Find the tab block: <div className="flex gap-2"> ... </div>
    # Pattern: from '<div className="flex gap-2">' to the matching '</div>'
    # that contains 'bg-primary text-primary-foreground'

    # Find start position
    start_marker = '<div className="flex gap-2">'
    start_idx = content.find(start_marker)

    if start_idx == -1:
        # Try alternate wrapper
        start_marker = '<div className="flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar">'
        start_idx = content.find(start_marker)

    if start_idx == -1:
        print(f"  SKIP: could not find tab wrapper div in {filepath}")
        return False

    # Find the matching closing </div> — need to count nested divs
    search_start = start_idx + len(start_marker)
    depth = 1
    pos = search_start
    while depth > 0 and pos < len(content):
        open_idx = content.find('<div', pos)
        close_idx = content.find('</div>', pos)

        if close_idx == -1:
            print(f"  SKIP: could not find closing div in {filepath}")
            return False

        if open_idx != -1 and open_idx < close_idx:
            depth += 1
            pos = open_idx + 4
        else:
            depth -= 1
            pos = close_idx + 6

    end_idx = pos

    # Replace the block
    content = content[:start_idx] + replacement + content[end_idx:]

    # Remove cn import if only used in the tab block
    cn_count = content.count('cn(')
    if cn_count == 0:
        content = content.replace("import { cn } from '@/lib/utils'\n", '')
        print(f"  Removed cn import (no longer used)")

    if content != original:
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"  CONVERTED: {filepath}")
        return True
    else:
        print(f"  NO CHANGES: {filepath}")
        return False


def convert_component_level_module(filepath, config):
    """Convert a module where tabs are defined as a const inside the component."""
    full_path = os.path.join(BASE, filepath)
    with open(full_path, 'r') as f:
        content = f.read()
    original = content

    # Build the replacement SegmentedTabs JSX
    replacement = build_segmented_tabs_jsx(config['tabs'])

    # Find the tab block — it starts with '<div className="flex gap-2">'
    start_marker = '<div className="flex gap-2">'
    start_idx = content.find(start_marker)

    if start_idx == -1:
        print(f"  SKIP: could not find tab wrapper div in {filepath}")
        return False

    # Find matching closing </div>
    search_start = start_idx + len(start_marker)
    depth = 1
    pos = search_start
    while depth > 0 and pos < len(content):
        open_idx = content.find('<div', pos)
        close_idx = content.find('</div>', pos)

        if close_idx == -1:
            print(f"  SKIP: could not find closing div in {filepath}")
            return False

        if open_idx != -1 and open_idx < close_idx:
            depth += 1
            pos = open_idx + 4
        else:
            depth -= 1
            pos = close_idx + 6

    end_idx = pos

    content = content[:start_idx] + replacement + content[end_idx:]

    # Remove cn import if no longer used
    cn_count = content.count('cn(')
    if cn_count == 0:
        content = content.replace("import { cn } from '@/lib/utils'\n", '')
        print(f"  Removed cn import")

    if content != original:
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"  CONVERTED: {filepath}")
        return True
    return False


def convert_data_file_module(filepath, config):
    """Convert a module where tabs come from a data file."""
    full_path = os.path.join(BASE, filepath)
    with open(full_path, 'r') as f:
        content = f.read()
    original = content

    tabs_var = config['tabs_var']

    # Replace the tab rendering block with SegmentedTabs
    # Find the <div> wrapper containing {tabs_var}.map(...)
    pattern = f'<div className="flex gap-2">'
    start_idx = content.find(pattern)

    if start_idx == -1:
        pattern = '<div className="flex flex-wrap gap-2">'
        start_idx = content.find(pattern)

    if start_idx == -1:
        print(f"  SKIP: could not find wrapper div in {filepath}")
        return False

    # Find matching closing </div>
    search_start = start_idx + len(pattern)
    depth = 1
    pos = search_start
    while depth > 0 and pos < len(content):
        open_idx = content.find('<div', pos)
        close_idx = content.find('</div>', pos)
        if close_idx == -1:
            return False
        if open_idx != -1 and open_idx < close_idx:
            depth += 1
            pos = open_idx + 4
        else:
            depth -= 1
            pos = close_idx + 6
    end_idx = pos

    replacement = f"""<SegmentedTabs
      tabs={{{tabs_var}.map((t) => ({{ value: t.id, label: t.label, icon: t.icon, badge: t.count }}))}}
      value={{tab}}
      onValueChange={{setTab}}
    />"""

    content = content[:start_idx] + replacement + content[end_idx:]

    # Remove cn import if no longer used
    cn_count = content.count('cn(')
    if cn_count == 0:
        content = content.replace("import { cn } from '@/lib/utils'\n", '')
        print(f"  Removed cn import")

    if content != original:
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"  CONVERTED: {filepath}")
        return True
    return False


def convert_admission_status_tabs():
    """Convert the Admission StatusTabs component."""
    full_path = os.path.join(BASE, ADMISSION_STATUS_TABS)
    with open(full_path, 'r') as f:
        content = f.read()
    original = content

    # Replace the entire component with one that uses SegmentedTabs
    new_content = """import { SegmentedTabs } from '../../shared/segmented-tabs'
import { STATUS_TABS, type ActiveTab } from './types'

interface StatusTabsProps {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  statusCounts: Record<string, number>
}

export function StatusTabs({ activeTab, setActiveTab, statusCounts }: StatusTabsProps) {
  return (
    <SegmentedTabs
      tabs={STATUS_TABS.map((tab) => ({
        value: tab.key,
        label: tab.label,
        icon: (() => { const Icon = tab.icon; return <Icon className="h-3.5 w-3.5" /> })(),
        badge: statusCounts[tab.key] || 0,
      }))}
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as ActiveTab)}
    />
  )
}
"""

    with open(full_path, 'w') as f:
        f.write(new_content)
    print(f"  CONVERTED: {ADMISSION_STATUS_TABS}")
    return True


def convert_students_profile_tabs():
    """Convert the Students profile tabs."""
    full_path = os.path.join(BASE, 'students/student-profile.tsx')
    with open(full_path, 'r') as f:
        content = f.read()
    original = content

    # Find and replace the tab pattern
    # The pattern is: activeTab === tab ? 'bg-primary text-primary-foreground' : ...
    if 'bg-primary text-primary-foreground' in content:
        content = content.replace(
            "'bg-primary text-primary-foreground'",
            "'bg-white dark:bg-white/10 shadow-sm text-foreground rounded-full'"
        )
        content = content.replace(
            "'text-muted-foreground hover:text-foreground hover:bg-accent/40'",
            "'text-muted-foreground hover:text-foreground hover:bg-muted/40'"
        )
        print(f"  PATCHED: students/student-profile.tsx")

    # Check if we need to add SegmentedTabs import
    if 'SegmentedTabs' not in content and 'bg-white dark:bg-white/10' in content:
        # For student-profile, the tabs are inline buttons — just fixing the style
        # is enough for now. Full SegmentedTabs conversion would require restructuring.
        pass

    if content != original:
        with open(full_path, 'w') as f:
            f.write(content)
        return True
    return False


if __name__ == '__main__':
    print("Converting inline modules...")
    for filepath, config in INLINE_MODULES.items():
        convert_inline_module(filepath, config)

    print("\nConverting component-level modules...")
    for filepath, config in COMPONENT_LEVEL_MODULES.items():
        convert_component_level_module(filepath, config)

    print("\nConverting data-file modules...")
    for filepath, config in DATA_FILE_MODULES.items():
        convert_data_file_module(filepath, config)

    print("\nConverting Admission StatusTabs...")
    convert_admission_status_tabs()

    print("\nConverting Students profile tabs...")
    convert_students_profile_tabs()

    print("\nDone.")
