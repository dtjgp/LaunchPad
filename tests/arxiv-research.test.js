const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ARXIV_RESEARCH_TRACKS,
  buildArxivResearchPreset,
  findMatchingArxivResearchTrack,
  matchArxivResearchTracks
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
