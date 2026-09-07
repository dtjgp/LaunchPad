(function exposeAcademicTrend(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.AcademicTrend = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createAcademicTrend() {
  const CACHE_VERSION = 1;
  const CACHE_TTL_MS = 60 * 60 * 1000;
  const REPOSITORY_NAME_PATTERN = /^[a-z\d_.-]+\/[a-z\d_.-]+$/i;

  const PROFILE_AREAS = [
    {
      id: 'model-compression',
      label: 'Model Compression',
      weight: 13,
      terms: [
        'model compression', 'structured pruning', 'channel pruning', 'pruning',
        'quantization', 'knowledge distillation', 'sparsity', 'sparse model',
        'low rank', 'mixture of experts', 'moe'
      ]
    },
    {
      id: 'edge-intelligence',
      label: 'Edge Intelligence',
      weight: 11,
      terms: [
        'edge ai', 'edge intelligence', 'on device', 'tinyml', 'embedded ai',
        'mobile inference', 'edge inference', 'resource constrained'
      ]
    },
    {
      id: 'communication-learning',
      label: '6G & Communication',
      weight: 10,
      terms: [
        '6g', 'wireless', 'semantic communication', 'communication efficient',
        'federated learning', 'distributed learning', 'network adaptive',
        'over the air'
      ]
    },
    {
      id: 'energy-systems',
      label: 'Energy Systems',
      weight: 10,
      terms: [
        'demand response', 'dynamic pricing', 'energy market', 'power system',
        'smart grid', 'load forecasting', 'energy internet', 'electricity market'
      ]
    },
    {
      id: 'research-agents',
      label: 'VLA & Research Agents',
      weight: 6,
      terms: [
        'vision language action', 'vla', 'llm agent', 'agent benchmark',
        'agent memory', 'foundation model', 'embodied ai', 'robot learning'
      ]
    },
    {
      id: 'machine-learning',
      label: 'Machine Learning',
      weight: 3,
      terms: ['machine learning', 'deep learning', 'computer vision', 'natural language processing']
    }
  ];

  const RESEARCH_ARTIFACT_TERMS = [
    'arxiv', 'paper', 'benchmark', 'dataset', 'reproducible', 'reproducibility',
    'ieee', 'acm', 'neurips', 'icml', 'iclr', 'cvpr'
  ];

  const SEARCH_PROFILES = [
    {
      area: 'model-compression',
      query: 'topic:model-compression'
    },
    {
      area: 'edge-intelligence',
      query: 'topic:edge-ai'
    },
    {
      area: 'communication-learning',
      query: '"semantic communication" in:name,description,topics'
    },
    {
      area: 'energy-systems',
      query: '"demand response" in:name,description,topics'
    },
    {
      area: 'research-agents',
      query: '"vision language action" in:name,description,topics'
    }
  ];

  function toFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function normalizeRepositoryName(value) {
    const name = typeof value === 'string' ? value.trim() : '';
    return REPOSITORY_NAME_PATTERN.test(name) ? name : '';
  }

  function normalizeStringArray(value, limit = 20) {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value
      .filter(item => typeof item === 'string')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean)))
      .slice(0, limit);
  }

  function normalizeOssInsight(payload) {
    const rows = Array.isArray(payload?.data?.rows) ? payload.data.rows : [];
    return rows.flatMap(row => {
      const title = normalizeRepositoryName(row?.repo_name);
      if (!title) return [];
      return [{
        id: `oss:${String(row.repo_id || title)}`,
        title,
        link: `https://github.com/${title}`,
        desc: typeof row.description === 'string' ? row.description.trim() : '',
        language: typeof row.primary_language === 'string' ? row.primary_language.trim() : '',
        stars: toFiniteNumber(row.stars),
        forks: toFiniteNumber(row.forks),
        pullRequests: toFiniteNumber(row.pull_requests),
        pushes: toFiniteNumber(row.pushes),
        sourceScore: toFiniteNumber(row.total_score),
        contributors: typeof row.contributor_logins === 'string'
          ? row.contributor_logins.split(',').filter(Boolean).length
          : 0,
        collections: typeof row.collection_names === 'string'
          ? row.collection_names.split(',').map(item => item.trim()).filter(Boolean)
          : [],
        topics: [],
        seedAreas: [],
        source: 'ossinsight'
      }];
    });
  }

  function normalizeGithubSearch(payload, area) {
    const rows = Array.isArray(payload?.items) ? payload.items : [];
    const items = rows.flatMap(row => {
      const title = normalizeRepositoryName(row?.full_name);
      if (!title || row?.archived || row?.fork) return [];
      return [{
        id: `github:${String(row.id || title)}`,
        title,
        link: `https://github.com/${title}`,
        desc: typeof row.description === 'string' ? row.description.trim() : '',
        language: typeof row.language === 'string' ? row.language.trim() : '',
        stars: toFiniteNumber(row.stargazers_count),
        forks: toFiniteNumber(row.forks_count),
        openIssues: toFiniteNumber(row.open_issues_count),
        updated: typeof row.pushed_at === 'string' ? row.pushed_at : '',
        topics: normalizeStringArray(row.topics),
        seedAreas: typeof area === 'string' ? [area] : [],
        license: typeof row.license?.spdx_id === 'string' ? row.license.spdx_id : '',
        sourceScore: 0,
        source: 'github-search'
      }];
    });

    return { items, incomplete: payload?.incomplete_results === true };
  }

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

  function mergeRepository(existing, incoming) {
    if (!existing) {
      return {
        ...incoming,
        topics: normalizeStringArray(incoming.topics),
        seedAreas: normalizeStringArray(incoming.seedAreas),
        sources: [incoming.source].filter(Boolean)
      };
    }
    const existingDescription = String(existing.desc || '');
    const incomingDescription = String(incoming.desc || '');
    const updatedCandidates = [existing.updated, incoming.updated].filter(Boolean).sort();
    return {
      ...existing,
      ...incoming,
      id: existing.id || incoming.id,
      desc: incomingDescription.length > existingDescription.length
        ? incomingDescription
        : existingDescription,
      language: incoming.language || existing.language || '',
      license: incoming.license || existing.license || '',
      stars: Math.max(toFiniteNumber(existing.stars), toFiniteNumber(incoming.stars)),
      forks: Math.max(toFiniteNumber(existing.forks), toFiniteNumber(incoming.forks)),
      pullRequests: Math.max(
        toFiniteNumber(existing.pullRequests),
        toFiniteNumber(incoming.pullRequests)
      ),
      pushes: Math.max(toFiniteNumber(existing.pushes), toFiniteNumber(incoming.pushes)),
      contributors: Math.max(
        toFiniteNumber(existing.contributors),
        toFiniteNumber(incoming.contributors)
      ),
      sourceScore: Math.max(
        toFiniteNumber(existing.sourceScore),
        toFiniteNumber(incoming.sourceScore)
      ),
      updated: updatedCandidates.at(-1) || '',
      topics: normalizeStringArray([...(existing.topics || []), ...(incoming.topics || [])]),
      seedAreas: normalizeStringArray([
        ...(existing.seedAreas || []),
        ...(incoming.seedAreas || [])
      ]),
      sources: Array.from(new Set([
        ...(existing.sources || []),
        existing.source,
        incoming.source
      ].filter(Boolean)))
    };
  }

  function scoreRepository(repository, now) {
    const searchable = normalizeForMatching([
      repository.title,
      repository.desc,
      repository.language,
      ...(repository.topics || []),
      ...(repository.collections || []),
      ...(repository.seedAreas || [])
    ].join(' '));
    const matchedAreas = [];
    let domainScore = 0;

    for (const area of PROFILE_AREAS) {
      const matches = area.terms.filter(term => includesTerm(searchable, term));
      if (matches.length === 0) continue;
      matchedAreas.push(area.label);
      domainScore += area.weight + Math.min(4, (matches.length - 1) * 2);
    }

    const artifactMatches = RESEARCH_ARTIFACT_TERMS.filter(term => includesTerm(searchable, term));
    const artifactScore = Math.min(12, artifactMatches.length * 3);
    const academicRelevance = domainScore + artifactScore;
    if (academicRelevance < 6) return null;

    const trendBase = repository.sourceScore > 0
      ? repository.sourceScore
      : repository.stars;
    const trendScore = Math.min(24, Math.log1p(Math.max(0, trendBase)) * 3.6);

    let activityScore = Math.min(
      8,
      Math.log1p(
        toFiniteNumber(repository.pushes) +
        toFiniteNumber(repository.pullRequests) +
        toFiniteNumber(repository.contributors)
      ) * 1.8
    );
    const updatedAt = Date.parse(repository.updated || '');
    if (Number.isFinite(updatedAt)) {
      const ageDays = Math.max(0, (now - updatedAt) / 86400000);
      activityScore = Math.max(activityScore, 8 * Math.exp(-ageDays / 30));
    }

    const qualityScore = Math.min(
      6,
      (repository.license ? 3 : 0) +
      (repository.topics?.length ? 2 : 0) +
      (repository.forks > 0 ? 1 : 0)
    );
    const score = Math.round((academicRelevance * 3 + trendScore + activityScore + qualityScore) * 10) / 10;
    const reasonParts = matchedAreas.slice(0, 3);
    if (artifactMatches.length) reasonParts.push('Research artifact signal');
    const sources = repository.sources?.length
      ? repository.sources
      : [repository.source].filter(Boolean);
    const sourceLabel = sources.includes('ossinsight') && sources.includes('github-search')
      ? 'OSS Insight + GitHub Search'
      : sources.includes('ossinsight')
        ? 'OSS Insight'
        : sources.includes('github-search')
          ? 'GitHub Search'
          : 'Academic ranking';

    return {
      ...repository,
      sources,
      sourceLabel,
      areas: matchedAreas,
      artifactSignals: artifactMatches,
      academicRelevance,
      score,
      reason: reasonParts.join(' · ')
    };
  }

  function mergeAndRankRepositories(items, options = {}) {
    const now = Number.isFinite(options.now) ? options.now : Date.now();
    const limit = Number.isInteger(options.limit) ? Math.max(1, Math.min(30, options.limit)) : 10;
    const mergedByName = new Map();

    for (const item of Array.isArray(items) ? items : []) {
      const title = normalizeRepositoryName(item?.title);
      if (!title) continue;
      const key = title.toLowerCase();
      mergedByName.set(key, mergeRepository(mergedByName.get(key), { ...item, title }));
    }

    const ranked = Array.from(mergedByName.values())
      .map(item => scoreRepository(item, now))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.stars - a.stars || a.title.localeCompare(b.title));
    const priorityAreas = PROFILE_AREAS
      .filter(area => area.id !== 'machine-learning')
      .map(area => area.label);
    const selected = [];

    for (const area of priorityAreas) {
      if (selected.length >= limit) break;
      if (selected.some(item => item.areas.includes(area))) continue;
      const candidate = ranked.find(item =>
        item.areas.includes(area) && !selected.some(selectedItem => selectedItem.title === item.title)
      );
      if (candidate) selected.push(candidate);
    }
    for (const candidate of ranked) {
      if (selected.length >= limit) break;
      if (!selected.some(item => item.title === candidate.title)) selected.push(candidate);
    }

    return selected
      .sort((a, b) => b.score - a.score || b.stars - a.stars || a.title.localeCompare(b.title))
      .slice(0, limit);
  }

  function buildGithubSearchRequests(now = Date.now()) {
    const referenceTime = Number.isFinite(now) ? now : Date.now();
    const since = new Date(referenceTime - 180 * 86400000).toISOString().slice(0, 10);
    return SEARCH_PROFILES.map(profile => {
      const url = new URL('https://api.github.com/search/repositories');
      url.searchParams.set(
        'q',
        `${profile.query} pushed:>=${since} archived:false fork:false stars:>=2`
      );
      url.searchParams.set('sort', 'stars');
      url.searchParams.set('order', 'desc');
      url.searchParams.set('per_page', '8');
      return { area: profile.area, url: url.href };
    });
  }

  function createTrendCache(items, coverage, now = Date.now()) {
    const timestamp = Number.isFinite(now) ? now : Date.now();
    return {
      version: CACHE_VERSION,
      fetchedAt: timestamp,
      expiresAt: timestamp + CACHE_TTL_MS,
      coverage: { ...(coverage || {}) },
      items: Array.isArray(items) ? items.map(item => ({ ...item })) : []
    };
  }

  function isFreshTrendCache(cache, now = Date.now()) {
    const timestamp = Number.isFinite(now) ? now : Date.now();
    return cache?.version === CACHE_VERSION &&
      Array.isArray(cache.items) &&
      cache.items.length > 0 &&
      Number.isFinite(cache.fetchedAt) &&
      Number.isFinite(cache.expiresAt) &&
      cache.fetchedAt <= timestamp + 5 * 60 * 1000 &&
      timestamp < cache.expiresAt;
  }

  return {
    PROFILE_AREAS,
    buildGithubSearchRequests,
    createTrendCache,
    isFreshTrendCache,
    mergeAndRankRepositories,
    normalizeGithubSearch,
    normalizeOssInsight
  };
});
