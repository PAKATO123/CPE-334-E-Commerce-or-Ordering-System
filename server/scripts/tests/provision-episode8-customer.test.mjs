import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { PassThrough } from 'node:stream';
import { EMAIL, SAFE_SELECT, proxyUrl, validPassword, createOnlyIfMissing, parseOptions, promptCustomerPassword, visiblePrompt } from '../provision-episode8-customer.mjs';

// Synthetic credentials only; no PrismaClient construction or database access.
const password = 'Offline-Fixture-Only-Aa12!';
const user = { id: 42, email: EMAIL, role: 'CUSTOMER', isActive: true, mustChangePassword: false };

test('password visibility is opt-in and accepted only with create', () => {
  assert.deepEqual(parseOptions(['--create']), { mode: '--create', visiblePassword: false });
  assert.deepEqual(parseOptions(['--check']), { mode: '--check', visiblePassword: false });
  for (const args of [['--create', '--visible-password'], ['--visible-password', '--create']]) {
    assert.deepEqual(parseOptions(args), { mode: '--create', visiblePassword: true });
  }
  for (const args of [[], ['--visible-password'], ['--check', '--visible-password'],
    ['--check', '--create'], ['--create', '--create'], ['--create', '--visible-password', '--visible-password'],
    ['--create', '--unknown']]) assert.equal(parseOptions(args), null);
});

test('customer password prompts remain hidden by default and opt in to visible entry', async () => {
  const calls = [];
  const prompts = {
    hidden: async label => { calls.push(['hidden', label]); return password; },
    visible: async label => { calls.push(['visible', label]); return password; },
  };
  assert.equal(await promptCustomerPassword('First: ', undefined, prompts), password);
  assert.equal(await promptCustomerPassword('New: ', true, prompts), password);
  assert.equal(await promptCustomerPassword('Repeat: ', true, prompts), password);
  assert.deepEqual(calls, [['hidden', 'First: '], ['visible', 'New: '], ['visible', 'Repeat: ']]);
});

function fakeTerminal() {
  const input = new PassThrough(), output = new PassThrough();
  input.isTTY = output.isTTY = true;
  input.setRawMode = () => {};
  let captured = '';
  output.on('data', chunk => { captured += chunk.toString(); });
  return { input, output, captured: () => captured };
}

test('visible input echoes normally, returns the answer and releases the terminal', async () => {
  const terminal = fakeTerminal();
  const answer = visiblePrompt('Password: ', terminal);
  terminal.input.write(password + '\r');
  assert.equal(await answer, password);
  assert.ok(terminal.captured().includes(password));
  assert.equal(terminal.input.isPaused(), true);
  terminal.input.destroy(); terminal.output.destroy();
});

test('visible entry rejects redirected input and cancellation uses a generic error', async () => {
  assert.throws(() => visiblePrompt('Password: ', { input: {}, output: {} }), /interactive terminal/);
  const terminal = fakeTerminal();
  const answer = visiblePrompt('Password: ', terminal);
  terminal.input.write('partial-secret\x03');
  await assert.rejects(answer, { message: 'Cancelled' });
  assert.equal(terminal.input.isPaused(), true);
  terminal.input.destroy(); terminal.output.destroy();
});

test('existing account is returned unchanged without insertion or password validation', async () => {
  let reads = 0;
  const prisma = { user: { findUnique: async args => {
    reads++; assert.deepEqual(args, { where: { email: EMAIL }, select: SAFE_SELECT }); return user;
  }, create: () => assert.fail('must not insert') } };
  assert.deepEqual(await createOnlyIfMissing(prisma, ''), { status: 'EXISTS_UNCHANGED', user });
  assert.equal(reads, 1);
});

test('only the fixed customer is inserted, with bcrypt cost 10 and safe selection', async () => {
  let creates = 0;
  const prisma = { user: { findUnique: async () => null, create: async args => {
    creates++;
    assert.deepEqual(args.select, SAFE_SELECT);
    assert.deepEqual(Object.keys(args.data).sort(), ['email', 'name', 'passwordHash', 'role', 'isActive', 'mustChangePassword'].sort());
    assert.equal(args.data.email, EMAIL);
    assert.equal(args.data.role, 'CUSTOMER');
    assert.equal(args.data.isActive, true);
    assert.equal(args.data.mustChangePassword, false);
    assert.equal(bcrypt.getRounds(args.data.passwordHash), 10);
    assert.equal(bcrypt.compareSync(password, args.data.passwordHash), true);
    return user;
  } } };
  const result = await createOnlyIfMissing(prisma, password);
  assert.equal(result.status, 'CREATED');
  assert.equal(creates, 1);
  assert.equal(JSON.stringify(result).includes('password'), false);
});

test('unique conflict returns the concurrent account without updating it', async () => {
  let reads = 0;
  const prisma = { user: {
    findUnique: async () => ++reads === 1 ? null : user,
    create: async () => { throw { code: 'P2002' }; },
  } };
  assert.deepEqual(await createOnlyIfMissing(prisma, password), { status: 'EXISTS_UNCHANGED', user });
});

test('weak or oversized passwords cannot insert', async () => {
  const prisma = { user: { findUnique: async () => null, create: () => assert.fail('must not insert') } };
  for (const value of ['short', 'x'.repeat(80) + 'Aa1', 'OnlyLettersLongEnough', 'Aa1' + '\u00e9'.repeat(35)]) {
    assert.equal(validPassword(value), false);
    await assert.rejects(createOnlyIfMissing(prisma, value));
  }
});

test('only the expected socket URL is adapted to the loopback proxy', () => {
  const source = 'postgresql://techtent:synthetic-password@localhost/techtent?host=/cloudsql/pakatopat-project:asia-southeast1:techtent-pg&schema=public';
  const url = new URL(proxyUrl(source));
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '5433');
  assert.equal(url.searchParams.has('host'), false);
  assert.equal(url.password, 'synthetic-password');
  for (const bad of [source.replace('techtent-pg', 'other-pg'), source.replace('/techtent?', '/other?'), source.replace('@localhost', '@remote')]) {
    assert.throws(() => proxyUrl(bad));
  }
});
