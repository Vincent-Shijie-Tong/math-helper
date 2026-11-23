let cached;
let pending;

// Only messages deliberately marked for display reach the page.
export class DisplayError extends Error {}

function expiryTime(value) {
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
    const timestamp = Number(value);
    return timestamp < 1e12 ? timestamp * 1000 : timestamp;
  }
  return typeof value === 'string' ? Date.parse(value) : NaN;
}

async function lookup() {
  const { KEYGEN_URL, KEYGEN_TOKEN } = process.env;
  if (!KEYGEN_URL || !KEYGEN_TOKEN || [KEYGEN_URL, KEYGEN_TOKEN].includes('paste-here')) {
    throw new DisplayError('Math Helper needs its two MindDo settings. Ask the person who runs it to check them.');
  }
  const endpoint = new URL(KEYGEN_URL.replace(/\/+$/, '') + '/api/lookup-key');
  if (endpoint.protocol !== 'https:') {
    throw new DisplayError('Use the secure https:// address supplied by MindDo.');
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEYGEN_TOKEN, Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok || data?.error) {
    const redact = text => text.replaceAll(KEYGEN_TOKEN, '[hidden]')
      .replace(/\bsk-[A-Za-z0-9_-]+/g, '[hidden]');
    if (typeof data?.error?.fix === 'string') console.error(redact(data.error.fix));
    throw new DisplayError(typeof data?.error?.message === 'string'
      ? redact(data.error.message) : 'MindDo could not provide a key.');
  }
  const expires = expiryTime(data?.expiresAt);
  if (typeof data?.apiKey !== 'string' || !data.apiKey.trim() || !(expires > Date.now())) {
    throw new DisplayError('MindDo returned an unusable or expired key.');
  }
  cached = { key: data.apiKey, expires };
  return cached.key;
}

export function discardKey(rejected) {
  if (cached?.key === rejected) cached = undefined;
}

export async function getKey() {
  if (cached && cached.expires > Date.now()) return cached.key;
  // Simultaneous questions share one lookup.
  pending ??= lookup().finally(() => { pending = undefined; });
  return pending;
}
