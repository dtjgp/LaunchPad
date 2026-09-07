const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildGithubSearchRequests,
  createTrendCache,
  isFreshTrendCache,
  mergeAndRankRepositories,
  normalizeGithubSearch,
  normalizeOssInsight
} = require('../academic-trend.js');

const NOW = Date.parse('2026-08-12T12:00:00Z');

test('normalizes OSS Insight rows and rejects malformed repository names', () => {
  const items = normalizeOssInsight({
    data: {
      rows: [
        {
          repo_name: 'edge-lab/tiny-pruner',
          description: 'Structured pruning for on-device inference with an arXiv paper',
          primary_language: 'Python',
          stars: '240',
          forks: '18',
          pull_requests: '5',
          pushes: '22',
          total_score: '512.5'
        },
        { repo_name: 'not/a/real/repository', stars: '9999' },
        { repo_name: '', stars: '9999' }
      ]
    }
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'edge-lab/tiny-pruner');
  assert.equal(items[0].link, 'https://github.com/edge-lab/tiny-pruner');
  assert.equal(items[0].stars, 240);
  assert.equal(items[0].source, 'ossinsight');
});

test('normalizes GitHub Search responses and retains incomplete coverage', () => {
  const result = normalizeGithubSearch({
    incomplete_results: true,
    items: [
      {
        id: 7,
        full_name: 'power-lab/dr-benchmark',
        html_url: 'https://github.com/power-lab/dr-benchmark',
        description: 'Demand response benchmark for dynamic pricing',
        language: 'Python',
        stargazers_count: 91,
        forks_count: 12,
        open_issues_count: 3,
        pushed_at: '2026-08-10T00:00:00Z',
        topics: ['demand-response', 'smart-grid'],
        license: { spdx_id: 'MIT' },
        archived: false,
        fork: false
      }
    ]
  }, 'energy-systems');

  assert.equal(result.incomplete, true);
  assert.equal(result.items[0].source, 'github-search');
  assert.deepEqual(result.items[0].seedAreas, ['energy-systems']);
  assert.equal(result.items[0].license, 'MIT');
});

test('normalizers safely handle empty payloads and incomplete repository metadata', () => {
  assert.deepEqual(normalizeOssInsight(null), []);
  const ossItems = normalizeOssInsight({
    data: {
      rows: [{
        repo_name: 'lab/minimal',
        stars: 'not-a-number',
        contributor_logins: 'alice,,bob',
        collection_names: 'AI, Edge'
      }]
    }
  });
  assert.equal(ossItems[0].desc, '');
  assert.equal(ossItems[0].language, '');
  assert.equal(ossItems[0].stars, 0);
  assert.equal(ossItems[0].contributors, 2);
  assert.deepEqual(ossItems[0].collections, ['AI', 'Edge']);

  assert.deepEqual(normalizeGithubSearch(null, null), { items: [], incomplete: false });
  const githubResult = normalizeGithubSearch({
    items: [
      { full_name: 'bad/name/shape' },
      { full_name: 'lab/archived', archived: true },
      { full_name: 'lab/fork', fork: true },
      {
        full_name: 'lab/sparse-edge',
        topics: ['Edge-AI', 'edge-ai', '', 7],
        archived: false,
        fork: false
      }
    ]
  }, null);
  assert.equal(githubResult.items.length, 1);
  assert.equal(githubResult.items[0].desc, '');
  assert.equal(githubResult.items[0].language, '');
  assert.equal(githubResult.items[0].updated, '');
  assert.equal(githubResult.items[0].license, '');
  assert.deepEqual(githubResult.items[0].topics, ['edge-ai']);
  assert.deepEqual(githubResult.items[0].seedAreas, []);
});

test('academic ranking favors the user research profile over generic popularity', () => {
  const ranked = mergeAndRankRepositories([
    {
      title: 'generic/super-popular-web-tool',
      link: 'https://github.com/generic/super-popular-web-tool',
      desc: 'A popular website builder and marketing agent',
      stars: 50000,
      forks: 4000,
      source: 'ossinsight',
      sourceScore: 9999,
      pushes: 100
    },
    {
      title: 'edge-lab/pk-prune',
      link: 'https://github.com/edge-lab/pk-prune',
      desc: 'Structured pruning and model compression for edge AI with reproducible benchmarks',
      topics: ['structured-pruning', 'edge-ai', 'benchmark'],
      stars: 180,
      forks: 20,
      source: 'github-search',
      updated: '2026-08-11T00:00:00Z',
      license: 'Apache-2.0'
    },
    {
      title: 'grid-lab/price-response',
      link: 'https://github.com/grid-lab/price-response',
      desc: 'Demand response and dynamic pricing experiments for smart grids',
      topics: ['demand-response'],
      stars: 80,
      source: 'github-search',
      updated: '2026-08-10T00:00:00Z'
    }
  ], { now: NOW, limit: 10 });

  assert.deepEqual(
    ranked.map(item => item.title),
    ['edge-lab/pk-prune', 'grid-lab/price-response']
  );
  assert.ok(ranked[0].score > ranked[1].score);
  assert.ok(ranked[0].areas.includes('Model Compression'));
  assert.ok(ranked[0].areas.includes('Edge Intelligence'));
  assert.match(ranked[0].reason, /Model Compression/);
});

test('ranking deduplicates sources and keeps richer metadata', () => {
  const ranked = mergeAndRankRepositories([
    {
      title: 'lab/edge-model',
      link: 'https://github.com/lab/edge-model',
      desc: 'Edge AI model compression',
      stars: 10,
      source: 'ossinsight',
      sourceScore: 400
    },
    {
      title: 'lab/edge-model',
      link: 'https://github.com/lab/edge-model',
      desc: 'Edge AI model compression with an arXiv paper and benchmark',
      topics: ['edge-ai', 'model-compression'],
      stars: 120,
      source: 'github-search',
      updated: '2026-08-11T00:00:00Z',
      license: 'MIT'
    }
  ], { now: NOW, limit: 10 });

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].stars, 120);
  assert.equal(ranked[0].license, 'MIT');
  assert.deepEqual(ranked[0].sources.sort(), ['github-search', 'ossinsight']);
  assert.equal(ranked[0].sourceLabel, 'OSS Insight + GitHub Search');
});

test('ranking handles empty input, bounded limits, and keeps a richer existing description', () => {
  assert.deepEqual(mergeAndRankRepositories(null), []);

  const ranked = mergeAndRankRepositories([
    {
      title: 'wireless/semantic-link',
      link: 'https://github.com/wireless/semantic-link',
      desc: 'Semantic communication benchmark with a paper',
      collections: ['6G'],
      stars: 40,
      sourceScore: 90,
      source: 'ossinsight'
    },
    {
      title: 'wireless/semantic-link',
      link: 'https://github.com/wireless/semantic-link',
      desc: 'Short',
      topics: ['wireless'],
      stars: 50,
      source: 'github-search'
    },
    { title: 'invalid', desc: 'model compression', source: 'github-search' }
  ], { now: NOW, limit: 0 });

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].desc, 'Semantic communication benchmark with a paper');
  assert.ok(ranked[0].artifactSignals.includes('paper'));
  assert.deepEqual(ranked[0].sources.sort(), ['github-search', 'ossinsight']);
});

test('top list preserves cross-disciplinary coverage when candidates exist', () => {
  const compressionItems = Array.from({ length: 6 }, (_, index) => ({
    title: `compression/repo-${index}`,
    link: `https://github.com/compression/repo-${index}`,
    desc: 'Structured pruning and model compression for edge AI benchmarks',
    topics: ['model-compression'],
    stars: 5000 - index * 100,
    source: 'github-search',
    updated: '2026-08-11T00:00:00Z'
  }));
  const energyItem = {
    title: 'grid/demand-response',
    link: 'https://github.com/grid/demand-response',
    desc: 'Demand response for dynamic pricing in smart grids',
    topics: ['demand-response'],
    stars: 20,
    source: 'github-search',
    updated: '2026-08-10T00:00:00Z'
  };

  const ranked = mergeAndRankRepositories(
    [...compressionItems, energyItem],
    { now: NOW, limit: 5 }
  );

  assert.equal(ranked.length, 5);
  assert.ok(ranked.some(item => item.title === 'grid/demand-response'));
});

test('builds five bounded official GitHub Search fallback requests', () => {
  const requests = buildGithubSearchRequests(NOW);

  assert.equal(requests.length, 5);
  assert.deepEqual(
    requests.map(request => request.area),
    ['model-compression', 'edge-intelligence', 'communication-learning', 'energy-systems', 'research-agents']
  );
  for (const request of requests) {
    const url = new URL(request.url);
    assert.equal(url.origin, 'https://api.github.com');
    assert.equal(url.pathname, '/search/repositories');
    assert.match(url.searchParams.get('q'), /pushed:>=2026-02-13/);
    assert.equal(url.searchParams.get('per_page'), '8');
  }
});

test('trend cache expires after one hour and rejects malformed data', () => {
  const cache = createTrendCache(
    [{ title: 'lab/model', link: 'https://github.com/lab/model', score: 42 }],
    { source: 'ossinsight+github-search', state: 'complete' },
    NOW
  );

  assert.equal(isFreshTrendCache(cache, NOW + 59 * 60 * 1000), true);
  assert.equal(isFreshTrendCache(cache, NOW + 61 * 60 * 1000), false);
  assert.equal(isFreshTrendCache({ items: [] }, NOW), false);

  assert.equal(isFreshTrendCache({ ...cache, version: 99 }, NOW), false);
  assert.equal(isFreshTrendCache({ ...cache, items: null }, NOW), false);
  assert.equal(isFreshTrendCache({ ...cache, fetchedAt: Number.NaN }, NOW), false);
  assert.equal(isFreshTrendCache({ ...cache, expiresAt: Number.NaN }, NOW), false);
  assert.equal(isFreshTrendCache({ ...cache, fetchedAt: NOW + 6 * 60 * 1000 }, NOW), false);

  const emptyCache = createTrendCache(null, null, Number.NaN);
  assert.deepEqual(emptyCache.items, []);
  assert.deepEqual(emptyCache.coverage, {});
  assert.ok(Number.isFinite(emptyCache.fetchedAt));
});
