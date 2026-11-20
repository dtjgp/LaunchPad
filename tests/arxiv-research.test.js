const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ARXIV_RESEARCH_TRACKS,
  buildArxivResearchPreset,
  findMatchingArxivResearchTrack,
  formatArxivAuthors,
  matchArxivResearchTracks,
  normalizeArxivAnnounceType,
  rankArxivItems
} = require('../arxiv-research.js');

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
