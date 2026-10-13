// SQL helper endpoints (format, minify, validate, transpile, optimize, lineage, check-safety, extract-params),
// dialects and EXPLAIN.
const { test, expect } = require('../fixtures/api');
const { expectError, expectNoSensitiveData } = require('../helpers/assertions');

// ---- every utility rejects a request without sql -------------------------------------------------------------------

for (const name of ['format', 'minify', 'validate', 'transpile', 'check-safety', 'lineage', 'optimize', 'extract-params']) {
  test(`${name} without sql is rejected`, async ({ datapilot }) => {
    await expectError(await datapilot.utility(name, {}), 400, 'sql is required');
  });
}

// ---- format / minify -----------------------------------------------------------------------------------------------

test('format puts the statement on several lines with upper-case keywords', async ({ datapilot }) => {
  const response = await datapilot.utility('format', { sql: 'select a,b from t where x=1', dialect: 'postgres' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.formatted_sql).toContain('SELECT');
  expect(body.formatted_sql).toContain('FROM');
  expect(body.formatted_sql).toContain('WHERE');
  expect(body.formatted_sql).toContain('\n');
});

test('minify collapses whitespace and reports consistent sizes', async ({ datapilot }) => {
  const response = await datapilot.utility('minify', { sql: 'SELECT   a\n   FROM t' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.minified_sql).toBe('SELECT a FROM t');
  expect(body.saved_bytes).toBe(body.original_length - body.minified_length);
  expect(body.minified_length).toBeLessThan(body.original_length);
});

// ---- validate ------------------------------------------------------------------------------------------------------

test('validate accepts valid SQL and reports its statement type', async ({ datapilot }) => {
  const response = await datapilot.utility('validate', { sql: 'SELECT 1' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.valid).toBe(true);
  expect(body.query_type).toBe('SELECT');
  expect(body.error).toBeNull();
});

test.fail('KNOWN DEFECT: validate reports incomplete SQL as invalid, with an error message', async ({ datapilot }) => {
  const body = await (await datapilot.utility('validate', { sql: 'SELECT * FROM' })).json(); // currently {"valid": true}

  expect(body.valid).toBe(false);
  expect(body.error).toEqual(expect.stringMatching(/.+/));
});

// ---- transpile -----------------------------------------------------------------------------------------------------

test('transpile translates T-SQL TOP into PostgreSQL LIMIT', async ({ datapilot }) => {
  const response = await datapilot.utility('transpile', { sql: 'SELECT TOP 5 * FROM t', source_dialect: 'tsql', target_dialect: 'postgres' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.transpiled_sql).toContain('LIMIT 5');
  expect(body.transpiled_sql).not.toContain('TOP');
  expect(body).toMatchObject({ source_dialect: 'tsql', target_dialect: 'postgres' });
});

test('transpile with an unknown dialect reports it and returns the original SQL unchanged', async ({ datapilot }) => {
  const response = await datapilot.utility('transpile', { sql: 'SELECT 1', source_dialect: 'not-a-dialect', target_dialect: 'postgres' });

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.error).toContain('Unknown dialect');
  expect(body.transpiled_sql).toBe('SELECT 1');
});

// ---- check-safety --------------------------------------------------------------------------------------------------

test('check-safety: a SELECT is read-only and safe', async ({ datapilot }) => {
  const response = await datapilot.utility('check-safety', { sql: 'SELECT 1' });

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, is_readonly: true, modifies_data: false, safe_to_execute: true, query_type: 'SELECT' });
});

test('check-safety: a DROP is data-modifying and unsafe, and names the affected table', async ({ datapilot }) => {
  const response = await datapilot.utility('check-safety', { sql: 'DROP TABLE x' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ is_readonly: false, modifies_data: true, safe_to_execute: false, query_type: 'DROP' });
  expect(body.affected_tables).toContain('x');
});

test('check-safety: an UPDATE is unsafe', async ({ datapilot }) => {
  const response = await datapilot.utility('check-safety', { sql: 'UPDATE t SET a = 1' });

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ modifies_data: true, safe_to_execute: false, query_type: 'UPDATE' });
});

// ---- lineage / optimize / extract-params ---------------------------------------------------------------------------

test('lineage reports both joined tables and the referenced columns', async ({ datapilot }) => {
  const response = await datapilot.utility('lineage', { sql: 'SELECT a.x FROM a JOIN b ON a.id = b.id' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.table_count).toBe(2);
  expect(body.tables).toHaveLength(2);
  expect(body.tables.map((t) => t.table).sort()).toEqual(['a', 'b']);
  expect(body.columns).toContain('x');
  expect(body.column_count).toBe(body.columns.length);
  expect(body.is_readonly).toBe(true);
});

test('optimize echoes the original SQL and returns a simplified form', async ({ datapilot }) => {
  const response = await datapilot.utility('optimize', { sql: 'SELECT * FROM t WHERE 1=1' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.original_sql).toBe('SELECT * FROM t WHERE 1=1');
  expect(body.optimized_sql).toEqual(expect.any(String));
  expect(body.optimized_sql).not.toContain('1=1');
  expect(body.dialect).toBe('postgres');
});

test('extract-params finds the named parameters and counts them', async ({ datapilot }) => {
  const response = await datapilot.utility('extract-params', { sql: 'SELECT * FROM t WHERE id = :id AND status = :status' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.parameters).toEqual(expect.arrayContaining(['id', 'status']));
  expect(body.parameters).toHaveLength(2);
  expect(body.parameter_count).toBe(body.parameters.length);
});

test('extract-params returns nothing for SQL without parameters', async ({ datapilot }) => {
  const body = await (await datapilot.utility('extract-params', { sql: 'SELECT 1' })).json();

  expect(body.parameters).toEqual([]);
  expect(body.parameter_count).toBe(0);
});

// ---- known defects: non-string sql ---------------------------------------------------------------------------------

test.fail('KNOWN DEFECT: format with a non-string sql is a 4xx and does not leak Python internals', async ({ datapilot }) => {
  const response = await datapilot.utility('format', { sql: 123 }); // currently 500

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});

test.fail('KNOWN DEFECT: check-safety with a non-string sql is a 4xx', async ({ datapilot }) => {
  const response = await datapilot.utility('check-safety', { sql: 123 }); // currently 500

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
});

// ---- dialects ------------------------------------------------------------------------------------------------------

test('dialects maps every name to a dialect string and the count agrees', async ({ datapilot }) => {
  const response = await datapilot.dialects();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Object.keys(body.dialects)).toHaveLength(body.count);
  for (const dialect of Object.values(body.dialects)) expect(dialect).toEqual(expect.any(String));
  for (const supported of ['postgres', 'mysql', 'oracle', 'sqlite', 'duckdb', 'trino']) expect(body.dialects).toHaveProperty(supported);
});

// ---- explain -------------------------------------------------------------------------------------------------------

test('explain returns a query plan for the SQLite connection', async ({ datapilot }) => {
  const response = await datapilot.explain({ connection_name: 'test-payroll', sql: 'SELECT * FROM main.salespeople' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ supported: true, database_type: 'SQLite', error_message: null, execution_time_ms: expect.any(Number) });
  expect(body.formatted_plan.nodes.length).toBeGreaterThan(0);
});

const invalidExplains = [
  { name: 'missing connection_name', data: { sql: 'SELECT 1' }, status: 400, error: 'connection_name is required' },
  { name: 'missing sql', data: { connection_name: 'test-payroll' }, status: 400, error: 'sql is required' },
  { name: 'unknown connection', data: { connection_name: 'zz-no-such-conn', sql: 'SELECT 1' }, status: 404, error: 'Connection "zz-no-such-conn" not found' },
];
for (const { name, data, status, error } of invalidExplains) {
  test(`explain rejects ${name}`, async ({ datapilot }) => {
    await expectError(await datapilot.explain(data), status, error);
  });
}
