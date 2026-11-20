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

  const ANNOUNCE_TYPE_PRIORITY = { new: 0, cross: 1, replace: 2, 'replace-cross': 3 };
  const ANNOUNCE_TYPE_LABELS = { new: 'New', cross: 'Cross-list', replace: 'Updated', 'replace-cross': 'Updated cross-list' };

  // arXiv RSS exposes <arxiv:announce_type>; the description repeats it as a fallback.
  function normalizeArxivAnnounceType(value, description = '') {
    const direct = String(value || '').trim().toLowerCase();
    if (Object.hasOwn(ANNOUNCE_TYPE_PRIORITY, direct)) return direct;
    const match = String(description || '').match(/Announce Type:\s*([a-z-]+)/i);
    const fromDescription = match ? match[1].toLowerCase() : '';
    return Object.hasOwn(ANNOUNCE_TYPE_PRIORITY, fromDescription) ? fromDescription : '';
  }

  function getArxivAnnounceLabel(type) {
    return ANNOUNCE_TYPE_LABELS[type] || '';
  }

  // New submissions first, then cross-lists, then revisions; ties keep the feed order.
  function rankArxivItems(items) {
    if (!Array.isArray(items)) return [];
    const priority = item => ANNOUNCE_TYPE_PRIORITY[item?.announceType] ?? 4;
    return items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => priority(left.item) - priority(right.item) || left.index - right.index)
      .map(entry => entry.item);
  }

  function formatArxivAuthors(value, max = 3) {
    const authors = String(value || '').split(',').map(author => author.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (authors.length <= max) return authors.join(', ');
    return `${authors.slice(0, max).join(', ')} et al.`;
  }

  function sameCategories(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    const normalizedLeft = Array.from(new Set(left.filter(value => typeof value === 'string'))).sort();
    const normalizedRight = Array.from(new Set(right.filter(value => typeof value === 'string'))).sort();
    return normalizedLeft.length === normalizedRight.length &&
      normalizedLeft.every((value, index) => value === normalizedRight[index]);
  }

  const ARXIV_ID_PATTERN = /^\d{4}\.\d{4,5}$/;
  const GITHUB_REPO_PATTERN = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i;

  function extractArxivId(link) {
    const match = String(link || '').match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})(?:v\d+)?/i);
    return match ? match[1] : '';
  }

  function buildArxivBibtex(item) {
    const arxivId = extractArxivId(item?.link);
    if (!arxivId) return '';
    // Braces and backslashes would unbalance the entry.
    const clean = value => String(value || '').replace(/[{}\\]/g, '').replace(/\s+/g, ' ').trim();
    const authors = clean(item.authors).split(/\s*,\s*/).filter(Boolean);
    const year = new Date(Date.parse(item.pubDate || '')).getUTCFullYear();
    const fields = [
      ['title', `{${clean(item.title)}}`],
      authors.length ? ['author', `{${authors.join(' and ')}}`] : null,
      Number.isFinite(year) ? ['year', `{${year}}`] : null,
      ['eprint', `{${arxivId}}`],
      ['archivePrefix', '{arXiv}'],
      /^[a-z-]+(\.[A-Z]{2})?$/i.test(item.category || '') ? ['primaryClass', `{${item.category}}`] : null,
      ['url', `{https://arxiv.org/abs/${arxivId}}`]
    ].filter(Boolean);
    return `@misc{arxiv${arxivId.replace('.', '_')},\n${fields.map(([key, value]) => `  ${key} = ${value}`).join(',\n')}\n}`;
  }

  function normalizeGithubRepo(value) {
    const match = String(value || '').trim().match(GITHUB_REPO_PATTERN);
    return match ? `https://github.com/${match[1]}/${match[2]}` : '';
  }

  // Hugging Face Daily Papers: community-curated arXiv papers with upvotes and optional code links.
  function parseHfDailyPapers(payload) {
    if (!Array.isArray(payload)) throw new Error('Hugging Face returned an unexpected payload');
    const seen = new Set();
    const items = [];
    for (const entry of payload) {
      const paper = entry?.paper;
      const arxivId = typeof paper?.id === 'string' ? paper.id.trim() : '';
      if (!ARXIV_ID_PATTERN.test(arxivId) || seen.has(arxivId)) continue;
      seen.add(arxivId);
      const upvotes = Number(paper.upvotes);
      const authors = Array.isArray(paper.authors)
        ? paper.authors.map(author => typeof author?.name === 'string' ? author.name.trim() : '').filter(Boolean).join(', ')
        : '';
      const submittedAt = typeof paper.submittedOnDailyAt === 'string' ? paper.submittedOnDailyAt : '';
      items.push({
        arxivId,
        title: String(paper.title || entry.title || 'Untitled').replace(/\s+/g, ' ').trim(),
        link: `https://arxiv.org/abs/${arxivId}`,
        hfLink: `https://huggingface.co/papers/${arxivId}`,
        description: String(paper.ai_summary || paper.summary || '').trim(),
        authors,
        upvotes: Number.isFinite(upvotes) && upvotes > 0 ? Math.floor(upvotes) : 0,
        githubRepo: normalizeGithubRepo(paper.githubRepo),
        category: 'HF Daily',
        pubDate: submittedAt
      });
    }
    return items.sort((left, right) => right.upvotes - left.upvotes);
  }

  function buildHfPaperIndex(items) {
    const index = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      if (item?.arxivId) index.set(item.arxivId, item);
    }
    return index;
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
    buildArxivBibtex,
    buildArxivResearchPreset,
    buildHfPaperIndex,
    extractArxivId,
    findMatchingArxivResearchTrack,
    formatArxivAuthors,
    getArxivAnnounceLabel,
    matchArxivResearchTracks,
    normalizeArxivAnnounceType,
    normalizeGithubRepo,
    parseHfDailyPapers,
    rankArxivItems
  };
});
