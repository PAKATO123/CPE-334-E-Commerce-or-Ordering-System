// Operator-only utility. Never imported by the application, migrations or seed.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'node:readline';
import { pathToFileURL } from 'node:url';

export const EMAIL = 'episode8.customer@example.com';
const CONNECTION = 'pakatopat-project:asia-southeast1:techtent-pg';
export const SAFE_SELECT = {
  id: true, email: true, role: true, isActive: true, mustChangePassword: true,
};

export function parseOptions(args) {
  const visiblePassword = args.includes('--visible-password');
  const modes = args.filter(arg => arg === '--check' || arg === '--create');
  if (modes.length !== 1 || new Set(args).size !== args.length ||
      args.some(arg => !['--check', '--create', '--visible-password'].includes(arg)) ||
      (visiblePassword && modes[0] !== '--create')) return null;
  return { mode: modes[0], visiblePassword };
}

// Accept the existing Cloud Run socket URL privately, but connect through the
// operator's separately verified loopback Auth Proxy. Never log this URL.
export function proxyUrl(secretUrl) {
  const url = new URL(secretUrl);
  if (url.protocol !== 'postgresql:' || url.hostname !== 'localhost' ||
      url.pathname !== '/techtent' || decodeURIComponent(url.username) !== 'techtent' ||
      !url.password || url.searchParams.get('host') !== `/cloudsql/${CONNECTION}`) {
    throw new Error('Unexpected database configuration');
  }
  url.hostname = '127.0.0.1';
  url.port = '5433';
  url.search = '';
  url.searchParams.set('schema', 'public');
  url.searchParams.set('connection_limit', '1');
  return url.toString();
}

export function validPassword(password) {
  return password.length >= 16 && Buffer.byteLength(password, 'utf8') <= 72 &&
    /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) &&
    !/[\x00-\x1f\x7f]/.test(password);
}

export async function createOnlyIfMissing(prisma, password) {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL }, select: SAFE_SELECT });
  if (existing) return { status: 'EXISTS_UNCHANGED', user: existing };
  if (!validPassword(password)) throw new Error('Invalid password');
  const passwordHash = bcrypt.hashSync(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        email: EMAIL, name: 'Episode 8 Test Customer', passwordHash,
        role: 'CUSTOMER', isActive: true, mustChangePassword: false,
      },
      select: SAFE_SELECT,
    });
    return { status: 'CREATED', user };
  } catch (error) {
    // A concurrent insertion must never become an update or password reset.
    if (error?.code !== 'P2002') throw new Error('Account creation failed');
    const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: SAFE_SELECT });
    if (!user) throw new Error('Account creation conflict');
    return { status: 'EXISTS_UNCHANGED', user };
  }
}

// Raw terminal key handling: no echo, no asterisks, no shell arguments/history.
// Reject redirected input so a noninteractive terminal cannot accidentally echo.
function hiddenPrompt(label) {
  const input = process.stdin;
  if (!input.isTTY || !process.stdout.isTTY || typeof input.setRawMode !== 'function') {
    throw new Error('A private interactive terminal is required');
  }
  process.stdout.write(label);
  readline.emitKeypressEvents(input);
  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    function finish(error) {
      input.removeListener('keypress', onKey);
      input.setRawMode(Boolean(wasRaw));
      input.pause();
      process.stdout.write('\n');
      if (error) { value = ''; reject(error); }
      else { const answer = value; value = ''; resolve(answer); }
    }
    function onKey(text, key = {}) {
      if (key.ctrl && (key.name === 'c' || key.name === 'd')) return finish(new Error('Cancelled'));
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') { value = Array.from(value).slice(0, -1).join(''); return; }
      if (!key.ctrl && !key.meta && text && !/[\x00-\x1f\x7f]/.test(text)) value += text;
    }
    input.on('keypress', onKey);
  });
}

// Explicit opt-in terminal echo only. Never pass the answer to a logger.
export function visiblePrompt(label, { input = process.stdin, output = process.stdout } = {}) {
  if (!input.isTTY || !output.isTTY) throw new Error('A private interactive terminal is required');
  const terminal = readline.createInterface({ input, output, terminal: true, historySize: 0 });
  return new Promise((resolve, reject) => {
    let answered = false;
    terminal.once('close', () => {
      input.pause();
      if (!answered) reject(new Error('Cancelled'));
    });
    terminal.once('SIGINT', () => terminal.close());
    terminal.question(label, answer => {
      answered = true;
      terminal.close();
      resolve(answer);
    });
  });
}

export function promptCustomerPassword(label, visible = false, prompts = { hidden: hiddenPrompt, visible: visiblePrompt }) {
  return (visible ? prompts.visible : prompts.hidden)(label);
}

function report(result) {
  console.log(JSON.stringify(result)); // SAFE_SELECT excludes all password material.
  if (result.user && (result.user.role !== 'CUSTOMER' || !result.user.isActive || result.user.mustChangePassword)) {
    console.log('Existing account is unsuitable for this test; no repair or reset was attempted.');
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (!options) {
    console.log('Usage: node server/scripts/provision-episode8-customer.mjs --check | --create [--visible-password]');
    return;
  }
  if (process.env.DEBUG || process.env.PRISMA_LOG_QUERIES) {
    throw new Error('Disable debug logging first');
  }
  console.log(`Target: ${CONNECTION}; database/user techtent; proxy 127.0.0.1:5433`);
  console.log(`Account: ${EMAIL}; mode: ${options.mode}`);
  let secretUrl = '', password = '', confirmation = '', prisma;
  try {
    secretUrl = await hiddenPrompt('Paste existing database URL privately (hidden): ');
    prisma = new PrismaClient({ datasources: { db: { url: proxyUrl(secretUrl) } }, log: [] });
    secretUrl = '';
    const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: SAFE_SELECT });
    if (user || options.mode === '--check') {
      report({ status: user ? 'EXISTS_UNCHANGED' : 'ABSENT', user });
      return;
    }
    if (options.visiblePassword) console.log('Visible password entry enabled: both entries will appear on this terminal.');
    const visibility = options.visiblePassword ? 'visible' : 'hidden';
    password = await promptCustomerPassword(`New customer password (${visibility}; 16+ characters, upper/lower/digit, <=72 UTF-8 bytes): `, options.visiblePassword);
    confirmation = await promptCustomerPassword(`Repeat new password (${visibility}): `, options.visiblePassword);
    if (password !== confirmation || !validPassword(password)) throw new Error('Password validation failed');
    confirmation = '';
    report(await createOnlyIfMissing(prisma, password));
  } finally {
    secretUrl = ''; password = ''; confirmation = '';
    if (prisma) await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    // Never print raw Prisma errors, connection strings, input or error stacks.
    console.error('Provisioning stopped. Check inputs, target, proxy and permissions privately; no reset was attempted.');
    process.exitCode = 1;
  });
}
