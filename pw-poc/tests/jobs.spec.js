// Background jobs: reads and unknown-id calls only. No job is created, paused, retried or deleted, and the worker pool is
// never touched.
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized } = require('../helpers/assertions');
const { JobsClient } = require('../clients/jobsClient');

test('the job list has a pagination envelope and well-formed jobs', async ({ jobs }) => {
  const response = await jobs.list();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.jobs).toEqual(expect.any(Array));
  for (const field of ['limit', 'offset', 'total_jobs']) expect(body[field], field).toEqual(expect.any(Number));
  expect(body.jobs.length).toBeLessThanOrEqual(body.limit);
  for (const job of body.jobs) {
    expect(job).toMatchObject({ id: expect.any(String), status: expect.any(String), job_type: expect.any(String), progress_percentage: expect.any(Number) });
  }
});

test('jobs health reports a running, healthy executor', async ({ jobs }) => {
  const response = await jobs.health();

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'healthy', executor_running: true, active_jobs: expect.any(Number), queue_size: expect.any(Number) });
});

test('workers status count matches the worker list', async ({ jobs }) => {
  const response = await jobs.workers();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.running).toEqual(expect.any(Boolean));
  expect(body.workers).toEqual(expect.any(Array));
  expect(body.num_workers).toBe(body.workers.length);
});

const unknownJob = 'zz-no-such-job';
const unknownCalls = [
  { name: 'get', call: (j) => j.get(unknownJob) },
  { name: 'details of', call: (j) => j.details(unknownJob) },
  { name: 'cancel', call: (j) => j.cancel(unknownJob) },
];
for (const { name, call } of unknownCalls) {
  test(`${name} an unknown job is a 404`, async ({ jobs }) => {
    await expectError(await call(jobs), 404, 'Job not found');
  });
}

test.fail('KNOWN DEFECT: the logs of an unknown job are a 404', async ({ jobs }) => {
  expect((await jobs.logs(unknownJob)).status()).toBe(404); // currently 200 with empty lists
});

test.fail('KNOWN DEFECT: the tasks of an unknown job are a 404', async ({ jobs }) => {
  expect((await jobs.tasks(unknownJob)).status()).toBe(404); // currently 200 with empty lists
});

test('jobs health without a token is rejected', async ({ anonymous }) => {
  await expectUnauthorized(await new JobsClient(anonymous).health());
});
