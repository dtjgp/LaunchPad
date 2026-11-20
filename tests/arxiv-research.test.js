const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ARXIV_RESEARCH_TRACKS,
  buildArxivBibtex,
  buildArxivResearchPreset,
  buildHfPaperIndex,
  extractArxivId,
  findMatchingArxivResearchTrack,
  formatArxivAuthors,
  matchArxivResearchTracks,
  normalizeArxivAnnounceType,
  normalizeGithubRepo,
  parseHfDailyPapers,
  rankArxivItems
} = require('../arxiv-research.js');

test('parseHfDailyPapers normalizes, dedupes and ranks Hugging Face papers by upvotes', () => {
  const items = parseHfDailyPapers([
    { paper: { id: '2611.00001', title: ' Low  ', summary: 'abstract', upvotes: 2, authors: [{ name: 'A' }, { name: ' ' }, {}] } },
    { paper: { id: '2611.00002', title: 'High', ai_summary: 'short', summary: 'long', upvotes: 40,
      githubRepo: 'https://github.com/org/repo.git', submittedOnDailyAt: '2026-11-20T00:00:00Z' } },
    { paper: { id: '2611.00002', title: 'Duplicate', upvotes: 99 } },
    { paper: { id: 'not-arxiv', title: 'Bad id', upvotes: 100 } },
    { paper: { id: '2611.00003', title: 'Unsafe repo', upvotes: -1, githubRepo: 'javascript:alert(1)' } },
    null
  ]);
  assert.deepEqual(items.map(item => item.arxivId), ['2611.00002', '2611.00001', '2611.00003']);
  assert.equal(items[0].description, 'short');
  assert.equal(items[0].githubRepo, 'https://github.com/org/repo');
  assert.equal(items[0].link, 'https://arxiv.org/abs/2611.00002');
  assert.equal(items[1].title, 'Low');
  assert.equal(items[1].authors, 'A');
  assert.equal(items[2].upvotes, 0);
  assert.equal(items[2].githubRepo, '');
  assert.throws(() => parseHfDailyPapers({ error: 'x' }), /unexpected/);
});

test('arXiv ids match across abs/pdf links and versions for HF badges', () => {
  assert.equal(extractArxivId('https://arxiv.org/abs/2611.26211v2'), '2611.26211');
  assert.equal(extractArxivId('https://arxiv.org/pdf/2611.2621'), '2611.2621');
  assert.equal(extractArxivId('https://example.com/abs/2611.26211'), '');
  const index = buildHfPaperIndex([{ arxivId: '2611.26211', upvotes: 5 }]);
  assert.equal(index.get(extractArxivId('https://arxiv.org/abs/2611.26211v1')).upvotes, 5);
  assert.equal(normalizeGithubRepo('https://github.com/org'), '');
  assert.equal(normalizeGithubRepo('http://github.com/org/repo'), '');
});

test('defines the four requested research tracks with the required arXiv domains', () => {
  assert.deepEqual(
    ARXIV_RESEARCH_TRACKS.map(track => track.id),
    ['edge-ai', 'communication-learning', 'energy-systems', 'vla-agents']
  );
  assert.ok(ARXIV_RESEARCH_TRACKS.find(track => track.id === 'edge-ai').categories.includes('cs.LG'));
  assert.ok(ARXIV_RESEARCH_TRACKS.find(track => track.id === 'communication-learning').categories.includes('eess.SP'));
  assert.ok(ARXIV_RESEARCH_TRACKS.find(track => track.id === 'energy-systems').categories.includes('eess.SY'));
  assert.ok(ARXIV_RESEARCH_TRACKS.find(track => track.id === 'vla-agents').categories.includes('cs.RO'));
});

test('builds a combined research preset without mutating track definitions', () => {
  const before = JSON.stringify(ARXIV_RESEARCH_TRACKS);
  const preset = buildArxivResearchPreset('all');

  assert.equal(preset.id, 'all');
  assert.equal(preset.label, 'All research');
  assert.equal(preset.mode, 'any');
  assert.ok(preset.categories.includes('eess.SY'));
  assert.ok(preset.categories.includes('cs.RO'));
  assert.match(preset.query, /semantic communication/i);
  assert.match(preset.query, /demand response/i);
  assert.match(preset.query, /vision language action/i);
  assert.equal(JSON.stringify(ARXIV_RESEARCH_TRACKS), before);
});

test('builds individual presets as defensive copies and rejects unknown tracks', () => {
  const preset = buildArxivResearchPreset('edge-ai');
  preset.categories.push('bad.category');

  assert.equal(
    ARXIV_RESEARCH_TRACKS.find(track => track.id === 'edge-ai').categories.includes('bad.category'),
    false
  );
  assert.equal(buildArxivResearchPreset('missing'), null);
});

test('matches papers to visible research-track explanations', () => {
  assert.deepEqual(
    matchArxivResearchTracks({
      title: 'Semantic communication for 6G wireless networks',
      description: 'Communication-efficient federated learning over the air'
    }).map(track => track.id),
    ['communication-learning']
  );
  assert.deepEqual(
    matchArxivResearchTracks({
      title: 'Dynamic pricing for demand response',
      description: 'A smart-grid benchmark for electricity markets'
    }).map(track => track.id),
    ['energy-systems']
  );
  assert.deepEqual(
    matchArxivResearchTracks({
      title: 'Vision-language-action models for robot learning',
      description: 'An embodied AI agent benchmark'
    }).map(track => track.id),
    ['vla-agents']
  );
  assert.deepEqual(
    matchArxivResearchTracks({ title: 'Research Agents for Scientific Discovery' })
      .map(track => track.id),
    ['vla-agents']
  );
  assert.deepEqual(matchArxivResearchTracks({ title: 'Generic database engine' }), []);
});

test('recognizes exact presets while leaving custom category/filter combinations unselected', () => {
  const preset = buildArxivResearchPreset('energy-systems');
  assert.equal(findMatchingArxivResearchTrack(preset.categories, preset.query), 'energy-systems');
  assert.equal(findMatchingArxivResearchTrack([...preset.categories].reverse(), preset.query), 'energy-systems');
  assert.equal(findMatchingArxivResearchTrack(preset.categories, preset.query, 'all'), '');
  assert.equal(findMatchingArxivResearchTrack(['cs.AI'], 'custom query'), '');
  assert.equal(findMatchingArxivResearchTrack(null, null), '');
});

test('reads arXiv announce types from the RSS field or the description fallback', () => {
  assert.equal(normalizeArxivAnnounceType(' Cross '), 'cross');
  assert.equal(normalizeArxivAnnounceType('', 'arXiv:2611.00001v2 Announce Type: replace-cross \nAbstract: x'), 'replace-cross');
  assert.equal(normalizeArxivAnnounceType('unknown', 'no marker'), '');
});

test('ranks new submissions before revisions while keeping feed order within a type', () => {
  const ranked = rankArxivItems([
    { id: 'r1', announceType: 'replace' },
    { id: 'n1', announceType: 'new' },
    { id: 'u1', announceType: '' },
    { id: 'c1', announceType: 'cross' },
    { id: 'n2', announceType: 'new' }
  ]);
  assert.deepEqual(ranked.map(item => item.id), ['n1', 'n2', 'c1', 'r1', 'u1']);
});

test('shortens long author lists', () => {
  assert.equal(formatArxivAuthors('Ada Lovelace,  Alan Turing'), 'Ada Lovelace, Alan Turing');
  assert.equal(formatArxivAuthors('A, B, C, D'), 'A, B, C et al.');
  assert.equal(formatArxivAuthors(''), '');
});

test('builds an arXiv BibTeX entry and skips links without an arXiv id', () => {
  const bibtex = buildArxivBibtex({
    title: 'Sparse {Edge} Models',
    link: 'https://arxiv.org/abs/2609.01234v2',
    authors: 'Ada Lovelace, Alan Turing',
    pubDate: '2026-09-02T00:00:00Z',
    category: 'cs.LG'
  });
  assert.match(bibtex, /^@misc\{arxiv2609_01234,/);
  assert.match(bibtex, /title = \{Sparse Edge Models\}/);
  assert.match(bibtex, /author = \{Ada Lovelace and Alan Turing\}/);
  assert.match(bibtex, /year = \{2026\}/);
  assert.match(bibtex, /eprint = \{2609\.01234\}/);
  assert.match(bibtex, /primaryClass = \{cs\.LG\}/);
  assert.doesNotMatch(buildArxivBibtex({ title: 'x', link: 'https://arxiv.org/abs/2609.01234', category: 'HF Daily' }), /primaryClass/);
  assert.equal(buildArxivBibtex({ title: 'x', link: 'https://example.com/paper' }), '');
});
