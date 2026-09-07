const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFilterQuery, matchesFilterAst } = require('../filter-query');
const { buildArxivResearchPreset } = require('../arxiv-research');

test('filters preserve phrases, AND precedence, grouping and legacy separators', () => {
  for (const query of ['("edge ai" OR pruning) AND energy', '("edge ai" | pruning) & energy', '("edge ai"; pruning),energy']) {
    const result = parseFilterQuery(query);
    assert.equal(result.ok, true);
    assert.equal(matchesFilterAst(result.ast, 'Pruning for energy efficiency'), true);
    assert.equal(matchesFilterAst(result.ast, 'Edge AI alone'), false);
  }
  const result = parseFilterQuery('pruning OR energy AND grid');
  assert.equal(matchesFilterAst(result.ast, 'pruning'), true);
  assert.equal(matchesFilterAst(result.ast, 'energy'), false);
  assert.equal(matchesFilterAst(result.ast, 'energy grid'), true);
});

test('implicit terms respect OR/AND mode and blank filters match all', () => {
  assert.equal(matchesFilterAst(parseFilterQuery('edge pruning', 'all').ast, 'edge inference'), false);
  assert.equal(matchesFilterAst(parseFilterQuery('edge pruning').ast, 'edge inference'), true);
  assert.equal(matchesFilterAst(parseFilterQuery('').ast, 'anything'), true);
  assert.equal(parseFilterQuery(buildArxivResearchPreset('all').query).ok, true);
});

test('malformed expressions report an error instead of silently accepting a partial AST', () => {
  for (const query of ['pruning AND', 'OR pruning', '(pruning', 'pruning)', '()', '"pruning', '""', 'pruning AND OR energy']) {
    const result = parseFilterQuery(query);
    assert.equal(result.ok, false, query);
    assert.equal(result.ast, null);
    assert.ok(result.error);
  }
  assert.equal(parseFilterQuery('('.repeat(70) + 'a' + ')'.repeat(70)).ok, false);
  assert.equal(parseFilterQuery('a'.repeat(4097)).ok, false);
});
