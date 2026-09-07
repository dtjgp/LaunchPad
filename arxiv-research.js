(function exposeArxivResearch(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.ArxivResearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createArxivResearch() {
  const ARXIV_RESEARCH_TRACKS = [
    {
      id: 'edge-ai',
      label: 'Edge AI',
      compactLabel: 'Edge AI',
      description: 'On-device and resource-constrained intelligence',
      categories: ['cs.AI', 'cs.LG', 'cs.CV', 'cs.NI', 'eess.SP'],
      query: '"edge ai" OR "edge intelligence" OR "on-device" OR "on device" OR TinyML OR "edge inference" OR "mobile inference"',
      terms: [
        'edge ai', 'edge intelligence', 'on-device', 'on device', 'tinyml',
        'edge inference', 'mobile inference', 'resource constrained'
      ]
    },
    {
      id: 'communication-learning',
      label: '6G & Communication',
      compactLabel: '6G / Comm',
      description: 'Wireless, semantic and communication-efficient learning',
      categories: ['cs.IT', 'cs.NI', 'eess.SP', 'cs.LG'],
      query: '6G OR wireless OR "semantic communication" OR "communication-efficient" OR "federated learning" OR "distributed learning" OR "over-the-air"',
      terms: [
        '6g', 'wireless', 'semantic communication', 'communication-efficient',
        'communication efficient', 'federated learning', 'distributed learning',
        'over-the-air', 'over the air'
      ]
    },
    {
      id: 'energy-systems',
      label: 'Energy Systems',
      compactLabel: 'Energy',
      description: 'Demand response, markets, pricing and smart grids',
      categories: ['eess.SY', 'cs.AI', 'cs.LG'],
      query: '"demand response" OR "dynamic pricing" OR "energy market" OR "electricity market" OR "power system" OR "smart grid" OR "load forecasting"',
      terms: [
        'demand response', 'dynamic pricing', 'energy market', 'electricity market',
        'power system', 'smart grid', 'load forecasting', 'energy internet'
      ]
    },
    {
      id: 'vla-agents',
      label: 'VLA & Research Agents',
      compactLabel: 'VLA / Agents',
      description: 'Embodied models, robot learning and research agents',
      categories: ['cs.RO', 'cs.CV', 'cs.AI', 'cs.CL', 'cs.LG'],
      query: '"vision language action" OR VLA OR "embodied ai" OR "robot learning" OR "llm agent" OR "llm agents" OR "research agent" OR "research agents" OR "agent benchmark"',
      terms: [
        'vision language action', 'vla', 'embodied ai', 'robot learning',
        'llm agent', 'llm agents', 'research agent', 'research agents',
        'agent benchmark', 'agent memory'
      ]
    }
  ];

  function normalizeForMatching(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[-_/]+/g, ' ')
      .replace(/[^a-z0-9.+\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function includesTerm(text, term) {
    const normalizedTerm = normalizeForMatching(term);
    if (!normalizedTerm) return false;
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(text);
  }

  function cloneTrack(track) {
    return track
      ? { ...track, categories: [...track.categories], terms: [...track.terms], mode: 'any' }
      : null;
  }

  function buildArxivResearchPreset(id) {
    if (id === 'all') {
      return {
        id: 'all',
        label: 'All research',
        compactLabel: 'All',
        description: 'All four research tracks',
        categories: Array.from(new Set(ARXIV_RESEARCH_TRACKS.flatMap(track => track.categories))),
        query: ARXIV_RESEARCH_TRACKS.map(track => `(${track.query})`).join(' OR '),
        terms: Array.from(new Set(ARXIV_RESEARCH_TRACKS.flatMap(track => track.terms))),
        mode: 'any'
      };
    }
    return cloneTrack(ARXIV_RESEARCH_TRACKS.find(track => track.id === id));
  }

  function matchArxivResearchTracks(item) {
    const searchable = normalizeForMatching(`${item?.title || ''} ${item?.description || ''}`);
    if (!searchable) return [];
    return ARXIV_RESEARCH_TRACKS
      .filter(track => track.terms.some(term => includesTerm(searchable, term)))
      .map(cloneTrack);
  }

  function sameCategories(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    const normalizedLeft = Array.from(new Set(left.filter(value => typeof value === 'string'))).sort();
    const normalizedRight = Array.from(new Set(right.filter(value => typeof value === 'string'))).sort();
    return normalizedLeft.length === normalizedRight.length &&
      normalizedLeft.every((value, index) => value === normalizedRight[index]);
  }

  function findMatchingArxivResearchTrack(categories, query, mode = 'any') {
    if (!Array.isArray(categories) || typeof query !== 'string' || mode !== 'any') return '';
    const candidates = [buildArxivResearchPreset('all'), ...ARXIV_RESEARCH_TRACKS.map(cloneTrack)];
    const match = candidates.find(candidate =>
      sameCategories(categories, candidate.categories) && query.trim() === candidate.query
    );
    return match?.id || '';
  }

  return {
    ARXIV_RESEARCH_TRACKS,
    buildArxivResearchPreset,
    findMatchingArxivResearchTrack,
    matchArxivResearchTracks
  };
});
