(() => {
'use strict';
if (window.HideFamilyCharacterProfileAdapterV1) return;

const VERSION = '2026.09.30-family-character-profile-consumer-v1';
const CACHE_KEY = 'hide_family_character_profile_v1';
let provider = null;

function clean(input) {
  if (!input || typeof input !== 'object') return null;
  const out = {
    member_id: String(input.member_id || ''),
    character_id: String(input.character_id || ''),
    identity_version: Number(input.identity_version || 0),
    master_asset_ref: String(input.master_asset_ref || ''),
    master_sha256: input.master_sha256 ? String(input.master_sha256) : null,
    asset_version: input.asset_version ? String(input.asset_version) : null,
    derivative_refs: input.derivative_refs && typeof input.derivative_refs === 'object' ? input.derivative_refs : {},
    status: String(input.status || 'CONFIRMED'),
    updated_at: String(input.updated_at || '')
  };
  if (!out.member_id || !out.character_id || !out.master_asset_ref || !Number.isInteger(out.identity_version) || out.identity_version < 1) return null;
  return out;
}

function cache(value) {
  const c = clean(value);
  if (!c) throw new Error('CHARACTER_PROFILE_INVALID');
  localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  return c;
}

function cached(memberId) {
  try {
    const c = clean(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'));
    return c && (!memberId || c.member_id === String(memberId)) ? c : null;
  } catch {
    return null;
  }
}

function registerProvider(next) {
  if (!next || typeof next.get !== 'function') throw new Error('FAMILY_CHARACTER_PROVIDER_INVALID');
  provider = next;
  return { provider_id: String(next.id || 'custom'), version: VERSION };
}

async function resolve(memberId) {
  const id = String(memberId || '');
  if (!id) return { source: 'NONE', projection: null };
  const local = cached(id);
  if (local) return { source: 'LOCAL_CACHE', projection: local };
  if (!provider) return { source: 'NONE', projection: null };
  const remote = clean(await provider.get(id));
  if (!remote) return { source: 'NONE', projection: null };
  return { source: 'PROVIDER', projection: cache(remote) };
}

window.HideFamilyCharacterProfileAdapterV1 = {
  version: VERSION,
  registerProvider,
  resolve,
  cached,
  status: () => ({ provider_available: !!provider, cached: !!cached() })
};
})();