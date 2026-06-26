export function mapBrowserLang(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower === 'zh-hk' ||
    lower === 'zh-tw' ||
    lower === 'zh-mo' ||
    lower.startsWith('zh-hant')
  ) {
    return 'zh-Hant';
  }
  if (lower.startsWith('zh')) {
    return 'zh-Hans';
  }
  return 'en';
}
