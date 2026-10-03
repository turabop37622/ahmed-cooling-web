// ?cat= values understood by /services. Footer and other links should use the canonical ids:
//   ac, refrigerator, washing-machine, stove, general (plus the popular / emergency chips).
export const FILTER_IDS = ['ac', 'refrigerator', 'washing-machine', 'stove', 'general', 'popular', 'emergency'];

const ALIASES = {
  cleaning: 'ac',
  gas: 'ac',
  washing: 'washing-machine',
  washer: 'washing-machine',
  fridge: 'refrigerator',
};

// Any ?cat= value -> a supported filter id, or 'all'
export function normalizeFilter(raw) {
  const v = String(Array.isArray(raw) ? raw[0] : raw ?? '').toLowerCase().trim();
  const id = ALIASES[v] || v;
  return FILTER_IDS.includes(id) ? id : 'all';
}
