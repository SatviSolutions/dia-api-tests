// Matches a concrete request (method + path) to one entry of pw-poc/endpoint-inventory.json.
// Route spellings come from the backend source: Flask converters (<int:id>, <uuid:id>, <string:x>, <x>, <path:x>) and
// FastAPI parameters ({x}). A request is credited to an endpoint only when its method and path really match, honouring the
// converters (so "abc" never matches an <int:...> route). When several routes match, the most specific one wins (more literal
// segments first, then stricter converters); an exact tie is reported as ambiguous and is NOT credited to any endpoint.

const TOKEN = /<(?:(int|float|uuid|string|path):)?([^>]+)>|\{([^}]+)\}/g;
const RANK = { int: 1, float: 1, uuid: 1, string: 2, path: 3 };
const SOURCE = {
  int: '[0-9]+',
  float: '[0-9]+\\.[0-9]+',
  uuid: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
  string: '[^/]+',
  path: '.+',
};

function normalizePath(value) {
  let text = String(value || '');
  const cut = text.search(/[?#]/);
  if (cut >= 0) text = text.slice(0, cut);
  if (!text.startsWith('/')) text = `/${text}`;
  if (text.length > 1 && text.endsWith('/')) text = text.slice(0, -1);
  return text;
}

const escapeLiteral = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(route) {
  const normalized = normalizePath(route);
  let source = '';
  let last = 0;
  let rank = 0;
  let match;
  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(normalized))) {
    source += escapeLiteral(normalized.slice(last, match.index));
    const converter = match[1] || 'string';
    source += `(${SOURCE[converter]})`;
    rank += RANK[converter];
    last = match.index + match[0].length;
  }
  source += escapeLiteral(normalized.slice(last));
  const segments = normalized.split('/').filter(Boolean);
  const literalSegments = segments.filter((segment) => !/[<{]/.test(segment)).length;
  const literalChars = normalized.replace(TOKEN, '').length;
  return { regex: new RegExp(`^${source}$`), literalSegments, rank, literalChars };
}

function buildMatcher(entries) {
  const byMethod = new Map();
  for (const entry of entries) {
    const method = String(entry.method).toUpperCase();
    if (!byMethod.has(method)) byMethod.set(method, []);
    byMethod.get(method).push({ entry, ...compile(entry.route) });
  }

  // Returns { entry } for a unique best match, { ambiguous: [entries] } for an exact tie, or {} when nothing matches.
  function match(method, requestPath) {
    const candidates = byMethod.get(String(method).toUpperCase());
    if (!candidates) return {};
    const path = normalizePath(requestPath);
    const hits = candidates.filter((candidate) => candidate.regex.test(path));
    if (hits.length === 0) return {};
    hits.sort((a, b) => b.literalSegments - a.literalSegments || a.rank - b.rank || b.literalChars - a.literalChars);
    const [best, second] = hits;
    if (second && second.literalSegments === best.literalSegments && second.rank === best.rank && second.literalChars === best.literalChars) {
      return { ambiguous: hits.filter((hit) => hit.literalSegments === best.literalSegments && hit.rank === best.rank && hit.literalChars === best.literalChars).map((hit) => hit.entry) };
    }
    return { entry: best.entry };
  }

  return { match };
}

module.exports = { buildMatcher, normalizePath };
