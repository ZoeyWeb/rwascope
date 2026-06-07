"""Abbreviation-aware first-sentence extraction for RWAscope intelligence scripts."""

ABBREVIATIONS = [
    # HK legal references (high-frequency)
    'Cap.',
    # Numbering / units
    'No.', 'Vol.', 'Ch.', 'Sec.', 'Art.', 'pg.', 'p.',
    # Company suffixes
    'Ltd.', 'Inc.', 'Co.', 'Pte.', 'Corp.', 'LLC.', 'LLP.', 'PLC.', 'GmbH.',
    # Honorifics
    'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Hon.', 'Sr.', 'Jr.',
    # Countries / regions
    'U.S.', 'U.K.', 'U.A.E.', 'E.U.', 'S.A.R.', 'P.R.C.', 'D.C.',
    # Latin abbreviations
    'e.g.', 'i.e.', 'etc.', 'cf.', 'al.', 'vs.', 'viz.',
    # Time / months
    'a.m.', 'p.m.',
    'Jan.', 'Feb.', 'Mar.', 'Apr.', 'Jun.', 'Jul.', 'Aug.',
    'Sep.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
    # Finance
    'Q1.', 'Q2.', 'Q3.', 'Q4.', 'FY.', 'YoY.', 'QoQ.',
]

# Sort longest first to avoid prefix conflicts (e.g. 'Sept.' before 'Sep.')
_PROTECTED = sorted(ABBREVIATIONS, key=len, reverse=True)
_PLACEHOLDER = '\x00ABBR\x00'


def first_sentence(text: str) -> str:
    """Return the first sentence of text, treating known abbreviations as non-terminal."""
    if not text:
        return ''
    protected = text
    mapping: dict[str, str] = {}
    for i, abbr in enumerate(_PROTECTED):
        if abbr in protected:
            token = f'{_PLACEHOLDER}{i}{_PLACEHOLDER}'
            protected = protected.replace(abbr, token)
            mapping[token] = abbr
    parts = protected.split('. ', 1)
    first = parts[0]
    for token, abbr in mapping.items():
        first = first.replace(token, abbr)
    if len(parts) > 1 and not first.endswith('.'):
        first = first + '.'
    return first.strip()


if __name__ == '__main__':
    cases = [
        (
            "HKMA issued the first two licences under the Stablecoins Ordinance (Cap. 656), "
            "which entered into force August 2025. Further details followed.",
            "HKMA issued the first two licences under the Stablecoins Ordinance (Cap. 656), "
            "which entered into force August 2025.",
        ),
        (
            "U.S. SEC charged Tron's Justin Sun. The case settled in March 2026.",
            "U.S. SEC charged Tron's Justin Sun.",
        ),
        (
            "Single sentence with no period",
            "Single sentence with no period",
        ),
        (
            "First. Second. Third.",
            "First.",
        ),
    ]
    all_pass = True
    for inp, expected in cases:
        got = first_sentence(inp)
        ok = got == expected
        if not ok:
            all_pass = False
        print(f"{'✓' if ok else '✗'} {got!r}")
        if not ok:
            print(f"  expected: {expected!r}")
    import sys
    sys.exit(0 if all_pass else 1)
