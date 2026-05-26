#!/usr/bin/env python3
"""Merge regulatory-tracker JSON entries into web/public/data/compliance/matrix.json"""

import json, os, glob
from datetime import date

TRACKER_DIR = os.path.join(os.path.dirname(__file__), '..', 'regulatory-tracker')
MATRIX_PATH = os.path.join(os.path.dirname(__file__), '..', 'web', 'public', 'data', 'compliance', 'matrix.json')

SIGNAL_MAP = {
    'open': 'open',
    'conditional': 'conditional',
    'restricted': 'restricted',
    'fragmented': 'conditional',  # matrix schema uses conditional for fragmented regimes
    'placeholder': 'placeholder',
}

REF_TYPE_MAP = {
    'court-ruling': 'court-record',
    'regulator-guidance': 'regulator-guidance',
    'primary-statute': 'primary-statute',
    'regulator-register': 'regulator-register',
    'official-statement': 'official-statement',
    'major-media': 'major-media',
    'industry-media': 'industry-media',
}

def load_tracker_files():
    """Load all jurisdiction/issue JSON files from regulatory-tracker/"""
    entries = []
    pattern = os.path.join(TRACKER_DIR, '*', '*.json')
    for path in glob.glob(pattern):
        with open(path) as f:
            entry = json.load(f)
        entries.append(entry)
    return entries

def tracker_to_cell(entry):
    """Convert a regulatory-tracker entry to a matrix cell"""
    references = []
    for ref in entry.get('references', []):
        ref_type = ref.get('type', 'industry-media')
        mapped_type = REF_TYPE_MAP.get(ref_type, 'industry-media')
        references.append({
            'title': ref['title'],
            'date': ref.get('date', ''),
            'url': ref['url'],
            'type': mapped_type,
        })

    signal = entry.get('status_signal', 'placeholder')
    mapped_signal = SIGNAL_MAP.get(signal, 'placeholder')

    return {
        'jurisdiction': entry['jurisdiction'],
        'issue': entry['issue'],
        'status_signal': mapped_signal,
        'summary': entry['summary'],
        'key_requirements': entry.get('key_requirements', []),
        'exemptions': entry.get('exemptions', []),
        'practitioner_notes': entry.get('practitioner_notes', ''),
        'references': references,
        'last_reviewed': entry.get('last_reviewed', None),
    }

def update_matrix():
    # Load existing matrix
    with open(MATRIX_PATH) as f:
        matrix = json.load(f)

    # Load tracker entries
    entries = load_tracker_files()
    print(f"Found {len(entries)} tracker entries")

    # Build lookup: (jurisdiction, issue) -> cell
    cells_by_key = {}
    for entry in entries:
        key = (entry['jurisdiction'], entry['issue'])
        cells_by_key[key] = tracker_to_cell(entry)

    # Update matrix cells
    updated_count = 0
    for i, cell in enumerate(matrix['cells']):
        key = (cell['jurisdiction'], cell['issue'])
        if key in cells_by_key:
            new_cell = cells_by_key[key]
            matrix['cells'][i] = new_cell
            updated_count += 1
            print(f"  Updated {key[0]}/{key[1]} → {new_cell['status_signal']}")

    # Update version and compile date
    parts = matrix['matrix_version'].split('.')
    if len(parts) == 3:
        parts[2] = str(int(parts[2]) + 1)
    matrix['matrix_version'] = '.'.join(parts)
    matrix['last_compiled'] = date.today().isoformat()

    # Write back
    with open(MATRIX_PATH, 'w') as f:
        json.dump(matrix, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Updated {updated_count} cells")
    print(f"   New version: {matrix['matrix_version']}")
    print(f"   Compiled: {matrix['last_compiled']}")

if __name__ == '__main__':
    update_matrix()
