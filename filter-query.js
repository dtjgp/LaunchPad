(function exposeFilterQuery(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FilterQuery = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createFilterQuery() {
  function parseFilterQuery(value, mode = 'any') {
    const input = typeof value === 'string' ? value.trim() : '';
    if (!input) return { ok: true, ast: null, error: '' };
    if (input.length > 4096) return { ok: false, ast: null, error: 'Use a filter shorter than 4097 characters.' };
    const tokens = [];
    let position = 0;
    try {
      while (position < input.length) {
        const char = input[position];
        if (/\s/.test(char)) { position += 1; continue; }
        if (char === '(' || char === ')') {
          tokens.push({ type: char }); position += 1; continue;
        }
        if (',&;|'.includes(char)) {
          tokens.push({ type: ',&'.includes(char) ? 'AND' : 'OR' });
          position += 1;
          if ((char === '&' || char === '|') && input[position] === char) position += 1;
          continue;
        }
        if (char === '"') {
          let phrase = '';
          let closed = false;
          position += 1;
          while (position < input.length) {
            if (input[position] === '"') { closed = true; position += 1; break; }
            if (input[position] === '\\' && ['"', '\\'].includes(input[position + 1])) position += 1;
            phrase += input[position++];
          }
          if (!closed) throw new Error('Close the quotation mark.');
          if (!phrase.trim()) throw new Error('Enter a term inside the quotation marks.');
          tokens.push({ type: 'TERM', value: phrase.trim() });
          continue;
        }
        const start = position;
        while (position < input.length && !/[\s()",&;|]/.test(input[position])) position += 1;
        const word = input.slice(start, position);
        tokens.push(/^(AND|OR)$/i.test(word) ? { type: word.toUpperCase() } : { type: 'TERM', value: word });
      }
      if (tokens.length > 1024) throw new Error('Use fewer terms in this filter.');
      const normalized = [];
      for (const token of tokens) {
        const previous = normalized.at(-1);
        if (previous && ['TERM', ')'].includes(previous.type) && ['TERM', '('].includes(token.type)) {
          normalized.push({ type: mode === 'all' ? 'AND' : 'OR' });
        }
        normalized.push(token);
      }
      position = 0;
      const peek = () => normalized[position];
      const primary = (depth) => {
        if (depth > 64) throw new Error('Use fewer nested groups.');
        const token = normalized[position++];
        if (!token) throw new Error('Enter a term after the operator.');
        if (token.type === 'TERM') return token;
        if (token.type === '(') {
          if (peek()?.type === ')') throw new Error('Enter a term inside the parentheses.');
          const expression = or(depth + 1);
          if (peek()?.type !== ')') throw new Error('Close the opened parenthesis.');
          position += 1;
          return expression;
        }
        throw new Error(token.type === ')' ? 'Remove the extra closing parenthesis.' : 'Enter a term before the operator.');
      };
      const and = depth => {
        let left = primary(depth);
        while (peek()?.type === 'AND') {
          position += 1;
          left = { type: 'AND', left, right: primary(depth) };
        }
        return left;
      };
      const or = depth => {
        let left = and(depth);
        while (peek()?.type === 'OR') {
          position += 1;
          left = { type: 'OR', left, right: and(depth) };
        }
        return left;
      };
      const ast = or(0);
      if (position !== normalized.length) throw new Error('Remove the extra closing parenthesis.');
      return { ok: true, ast, error: '' };
    } catch (error) {
      return { ok: false, ast: null, error: error.message };
    }
  }

  function matchesFilterAst(ast, value) {
    const text = String(value || '').toLowerCase();
    const matches = node => !node ? true : node.type === 'TERM'
      ? text.includes(node.value.toLowerCase())
      : node.type === 'AND' ? matches(node.left) && matches(node.right)
        : matches(node.left) || matches(node.right);
    return matches(ast);
  }

  return { parseFilterQuery, matchesFilterAst };
});
