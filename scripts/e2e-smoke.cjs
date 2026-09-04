'use strict';

const { randomUUID } = require('node:crypto');
const request = require('supertest');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3005';
const WAIT_MS = Number(process.env.E2E_SMOKE_WAIT_MS || 90_000);
const SETTINGS_WAIT_MS = Number(process.env.E2E_SMOKE_SETTINGS_WAIT_MS || 20_000);

function unwrap(body) {
  if (
    body &&
    typeof body === 'object' &&
    body.success === true &&
    Object.prototype.hasOwnProperty.call(body, 'data')
  ) {
    return body.data;
  }
  return body;
}

function snapIdOf(value) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  if (typeof value.id === 'string' && value.id.length > 0) {
    return value.id;
  }
  if (typeof value._id === 'string' && value._id.length > 0) {
    return value._id;
  }
  if (value._id && typeof value._id === 'object') {
    if (typeof value._id.$oid === 'string') {
      return value._id.$oid;
    }
    const asString = String(value._id);
    if (asString && asString !== '[object Object]') {
      return asString;
    }
  }
  return undefined;
}

function fail(method, path, res) {
  return new Error(
    `${method} ${path} -> ${res.status} ${JSON.stringify(res.body)}`,
  );
}

async function call(method, path, options = {}) {
  const expected = options.status ?? (method === 'post' ? 201 : 200);
  let req = request(GATEWAY_URL)[method](path);
  if (options.token) {
    req = req.set('Authorization', `Bearer ${options.token}`);
  }
  if (options.body !== undefined) {
    req = req.send(options.body);
  }
  const res = await req;
  if (res.status !== expected) {
    throw fail(method.toUpperCase(), path, res);
  }
  return { res, data: unwrap(res.body) };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  const deadline = Date.now() + WAIT_MS;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const res = await request(GATEWAY_URL).get('/health');
      if (res.status === 200 && res.body && res.body.status === 'ok') {
        return;
      }
      lastError = fail('GET', '/health', res);
    } catch (err) {
      lastError = err;
    }
    await sleep(2000);
  }
  const hint =
    'Start the local stack with `docker compose -f docker-compose.dev.yml up`. This smoke is local-required and is not run in CI.';
  throw new Error(
    `Gateway not healthy at ${GATEWAY_URL}/health. ${hint}${
      lastError ? ` Last error: ${lastError.message}` : ''
    }`,
  );
}

async function waitForSettings(token, body) {
  const deadline = Date.now() + SETTINGS_WAIT_MS;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await call('put', '/users/settings', {
        token,
        body,
        status: 200,
      });
    } catch (err) {
      lastError = err;
      await sleep(500);
    }
  }
  throw lastError;
}

async function main() {
  console.log(`e2e-smoke: ${GATEWAY_URL}`);
  await waitForHealth();

  const email = `smoke-${Date.now()}@localhost`;
  const password = 'SmokeTest1!';
  const lng = 13.405;
  const lat = 52.52;
  const idempotencyKey = randomUUID();

  const signup = await call('post', '/auth/signup', {
    body: {
      email,
      password,
      firstName: 'Smoke',
      lastName: 'Test',
    },
  });
  const token = signup.data?.tokens?.accessToken;
  if (!token) {
    throw new Error(`signup missing access token: ${JSON.stringify(signup.data)}`);
  }

  await waitForSettings(token, {
    maxDistance: 5000,
    newSnapDistance: 500,
    snapDisappearTime: 3,
  });

  const presign = await call('post', '/storage/presigned-upload', {
    token,
    body: {
      filename: 'smoke.jpg',
      contentType: 'image/jpeg',
      prefix: 'snaps',
    },
  });
  const objectKey = presign.data?.key;
  if (typeof objectKey !== 'string' || objectKey.length === 0) {
    throw new Error(`presign missing key: ${JSON.stringify(presign.data)}`);
  }

  const createBody = {
    description: 'e2e smoke snap',
    location: { type: 'Point', coordinates: [lng, lat] },
    snaps: [objectKey],
    tag: 'SOCIAL',
    idempotencyKey,
  };

  const created = await call('post', '/snaps', { token, body: createBody });
  const firstId = snapIdOf(created.data);
  if (!firstId) {
    throw new Error(`create snap missing id: ${JSON.stringify(created.data)}`);
  }

  const replay = await call('post', '/snaps', { token, body: createBody });
  const replayId = snapIdOf(replay.data);
  if (replayId !== firstId) {
    throw new Error(
      `idempotent create returned ${replayId}, expected ${firstId}`,
    );
  }

  const nearby = await call('get', `/snaps/near/${lng}/${lat}`, {
    token,
    status: 200,
  });
  const nearbyRows = Array.isArray(nearby.data) ? nearby.data : [];
  if (!nearbyRows.some((row) => snapIdOf(row) === firstId)) {
    throw new Error(
      `nearby did not include created snap ${firstId}: ${JSON.stringify(nearby.data)}`,
    );
  }

  const mine = await call('get', '/snaps/me', { token, status: 200 });
  const mineRows = Array.isArray(mine.data) ? mine.data : [];
  if (!mineRows.some((row) => snapIdOf(row) === firstId)) {
    throw new Error(
      `GET /snaps/me did not include ${firstId}: ${JSON.stringify(mine.data)}`,
    );
  }

  await call('delete', `/snaps/${firstId}`, { token, status: 200 });

  const exported = await call('get', '/users/me/export', {
    token,
    status: 200,
  });
  if (exported.data?.user?.email !== email) {
    throw new Error(`export email mismatch: ${JSON.stringify(exported.data)}`);
  }
  if (!Array.isArray(exported.data?.snaps)) {
    throw new Error(`export missing snaps array: ${JSON.stringify(exported.data)}`);
  }

  await call('delete', '/users/me', {
    token,
    body: { password },
    status: 200,
  });

  const loginAfter = await request(GATEWAY_URL)
    .post('/auth/login')
    .send({ email, password });
  if (loginAfter.status < 400) {
    throw fail('POST', '/auth/login after delete', loginAfter);
  }

  console.log('e2e-smoke: ok');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
