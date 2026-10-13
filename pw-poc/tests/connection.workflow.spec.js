// Connection CRUD and monitoring-interval lifecycles. Each workflow creates a metadata-only SQLite connection with a unique
// name (it points at a file that does not exist and is never queried), runs serially, and always deletes it afterwards.
const { test, expect } = require('../fixtures/api');
const { expectError, expectNoSecretKeys } = require('../helpers/assertions');
const { ConnectionsClient } = require('../clients/connectionsClient');

const throwAway = (name, extra = {}) => ({ name, db_type: 'sqlite', database_name: '/tmp/zz-api-test-not-a-real-file.db', ...extra });
const findIn = async (connections, id) => (await (await connections.list()).json()).connections.find((c) => c.id === id);

test.describe('connection CRUD lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  const name = `zz-api-pw-crud-${Date.now()}`;
  let id;
  test.afterAll(async ({ api }) => {
    if (id) await new ConnectionsClient(api).delete(id); // 404 when the delete step already ran
  });

  test('create a throw-away connection', async ({ connections }) => {
    const response = await connections.create(throwAway(name, { environment_type: 'DEV', tags: 'api-test' }));

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ success: true, id: expect.any(Number), name });
    id = body.id;
  });

  test('read it back by id: stored values match and no credentials are exposed', async ({ connections }) => {
    const response = await connections.get(id);

    expect(response.status()).toBe(200);
    const { connection } = await response.json();
    expect(connection).toMatchObject({ id, name, db_type: 'sqlite', environment_type: 'DEV', tags: 'api-test' });
    expectNoSecretKeys(connection, 'connection');
  });

  test('it appears in the connection list, enabled', async ({ connections }) => {
    expect(await findIn(connections, id)).toMatchObject({ name, disabled: 0 });
  });

  test('update the tags', async ({ connections }) => {
    const response = await connections.update(id, { tags: 'api-test, updated' });

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, id });
  });

  test('the update is persisted and other fields are unchanged', async ({ connections }) => {
    const { connection } = await (await connections.get(id)).json();

    expect(connection).toMatchObject({ tags: 'api-test, updated', name, db_type: 'sqlite' });
  });

  test('toggle disables the connection', async ({ connections }) => {
    const response = await connections.toggle(id);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'success', disabled: 1 });
    expect(body.message).toContain('disabled');
  });

  test('delete the connection', async ({ connections }) => {
    const response = await connections.delete(id);

    expect(response.status()).toBe(200);
    expect((await response.json()).status).toBe('success');
  });

  test('the deleted connection is a 404', async ({ connections }) => {
    await expectError(await connections.get(id), 404, 'Connection not found');
  });

  test('the deleted connection is gone from the list', async ({ connections }) => {
    expect(await findIn(connections, id)).toBeUndefined();
  });

  test('deleting the connection again is a 404', async ({ connections }) => {
    const response = await connections.delete(id);

    await expectError(response, 404, 'Connection not found');
    expect((await response.json()).status).toBe('error');
  });
});

test.describe('connection monitoring-interval lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  const name = `zz-api-pw-mon-${Date.now()}`;
  let id;
  test.afterAll(async ({ api }) => {
    if (id) await new ConnectionsClient(api).delete(id);
  });

  test('create a throw-away connection to monitor', async ({ connections }) => {
    const response = await connections.create(throwAway(name));

    expect(response.status()).toBe(201);
    id = (await response.json()).id;
  });

  test('set the interval to 15 minutes', async ({ connections }) => {
    const response = await connections.setMonitorInterval(id, { interval_minutes: 15 });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'success', interval_minutes: 15 });
    expect(body.message).toContain('every 15 minute');
    expect(body.message).toContain(name);
  });

  test('the interval is visible in the connection list', async ({ connections }) => {
    expect((await findIn(connections, id)).monitor_interval_minutes).toBe(15);
  });

  const rejected = [
    { name: 'a negative interval', value: -1, message: 'Interval must be 0 or positive' },
    { name: 'a non-numeric interval', value: 'abc', message: 'Invalid interval value' },
  ];
  for (const { name: label, value, message } of rejected) {
    test(`${label} is rejected`, async ({ connections }) => {
      const response = await connections.setMonitorInterval(id, { interval_minutes: value });

      await expectError(response, 400, message);
      expect((await response.json()).status).toBe('error');
    });
  }

  test('rejected values did not change the stored interval', async ({ connections }) => {
    expect((await findIn(connections, id)).monitor_interval_minutes).toBe(15);
  });

  test('an interval of 0 turns monitoring off', async ({ connections }) => {
    const response = await connections.setMonitorInterval(id, { interval_minutes: 0 });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.interval_minutes).toBe(0);
    expect(body.message).toContain('never');
  });

  test('delete the throw-away connection', async ({ connections }) => {
    const response = await connections.delete(id);

    expect(response.status()).toBe(200);
    expect((await response.json()).status).toBe('success');
  });

  test('setting the interval on the deleted connection is a 404', async ({ connections }) => {
    const response = await connections.setMonitorInterval(id, { interval_minutes: 5 });

    await expectError(response, 404, 'Connection not found');
    expect((await response.json()).status).toBe('error');
  });
});
