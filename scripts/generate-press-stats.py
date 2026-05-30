#!/usr/bin/env python3
"""Generate press statistics CSV for RWAscope.

Usage: python3 scripts/generate-press-stats.py
Output: web/public/press/rwascope-key-stats.csv
"""

import json
import csv
import datetime
import os
from collections import Counter

TODAY = datetime.date.today().isoformat()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, 'web', 'public', 'data')
OUT = os.path.join(ROOT, 'web', 'public', 'press', 'rwascope-key-stats.csv')


def load(rel_path):
    with open(os.path.join(BASE, rel_path)) as f:
        return json.load(f)


projects = load('projects/projects.json')
incidents = load('incidents/incidents.json')
issuers = load('licenses/issuers.json')
assets = load('assets/assets.json')

by_year = Counter(i.get('date', '')[:4] for i in incidents)
by_severity = Counter(i.get('severity', 'unknown') for i in incidents)
asset_cats = Counter(a.get('assetCategory', 'unknown') for a in assets)

rows = [
    ['Metric', 'Value', 'As of date'],
    ['Active RWA projects tracked', len(projects), TODAY],
    ['Indexed incidents', len(incidents), TODAY],
    ['Stablecoin issuers (SARM)', len(issuers), TODAY],
    ['Tokenized assets (RARM)', len(assets), TODAY],
    ['Jurisdictions covered', 7, TODAY],
    ['Academic frameworks', 2, TODAY],
]

for year, count in sorted(by_year.items()):
    rows.append([f'Incidents {year}', count, TODAY])

for sev, count in sorted(by_severity.items(), key=lambda x: -x[1]):
    rows.append([f'Incidents — severity: {sev}', count, TODAY])

for cat, count in sorted(asset_cats.items()):
    label = cat.replace('-', ' ').title()
    rows.append([f'Asset class: {label}', count, TODAY])

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f'Written: {OUT}')
print(f'Rows: {len(rows) - 1} data rows + header')
