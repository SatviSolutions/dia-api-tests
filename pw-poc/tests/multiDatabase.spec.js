// The same execute -> count -> history workflow against every database type DIA can execute against here
// A deterministic computed result is used, so no table data is assumed.
// The PostgreSQL connection "test" is excluded: it points at localhost:5432, which is unreachable in this environment.
const { test, expect } = require('../fixtures/api');

const UNION3 = 'SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3';
const ORACLE3 = 'SELECT 1 AS n FROM DUAL UNION ALL SELECT 2 FROM DUAL UNION ALL SELECT 3 FROM DUAL'; // Oracle needs FROM DUAL
const databases = [
  { db_type: 'sqlite', connection_name: 'HR Sample' },
  { db_type: 'duckdb', connection_name: 'Sales Data' },
  { db_type: 'mysql', connection_name: 'test-crm' },
  { db_type: 'csv', connection_name: 'test_customer' },
  { db_type: 'json', connection_name: 'test_orders' },
  { db_type: 'parquet', connection_name: 'test_support_tickets' },
  { db_type: 'excel', connection_name: 'test_subscriptions' },
  { db_type: 'trino', connection_name: 'Trino' },
  { db_type: 'oracle', connection_name: 'Oracle EBS Vision', sql: ORACLE3 },
];

for (const { db_type, connection_name, sql = UNION3 } of databases) {
  test(`${db_type} (${connection_name}): execute, count and history agree`, async ({ datapilot }) => {
    const executed = await datapilot.execute({ connection_name, sql });

    expect(executed.status()).toBe(200);
    const body = await executed.json();
    expect(body.status, body.error).toBe('success');
    expect(body.row_count).toBe(3);
    expect(body.data).toHaveLength(3);
    expect(body.columns).toHaveLength(1);
    expect(body.query_log_id).toEqual(expect.any(Number));

    const counted = await datapilot.count({ query_log_id: body.query_log_id, connection_name, sql });
    expect(counted.status()).toBe(200);
    const count = await counted.json();
    expect(count.total_row_count).toBe(3);
    expect(count.from_cache).toEqual(expect.any(Boolean));

    // the execution is recorded in history as a success on the right connection and engine
    const history = await (await datapilot.history({ limit: 100 })).json();
    expect(history.find((h) => h.id === body.query_log_id)).toMatchObject({ connection_name, sql_text: sql, status: 'success', db_type });
  });
}
