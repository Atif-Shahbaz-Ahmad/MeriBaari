/**
 * Local standalone Android APK → builds/MeriBaari-preview.apk
 * Loads repo-root .env, excludes the Expo dev client, and fails if the APK is 50 MB or larger.
 *
 * MERIBAARI_TEST_ARCH=x86_64  → emulator test APK (not the upload artifact)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MAX_BYTES = 50 * 1024 * 1024;
const OUT_APK = path.join(ROOT, 'builds', 'MeriBaari-preview.apk');
const TEST_APK = path.join(ROOT, 'builds', 'MeriBaari-emulator-test.apk');
const PKG_PATH = path.join(ROOT, 'package.json');
const ANDROID_SDK =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');

const DEV_CLIENT_PACKAGES = [
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function run(command, args, extraEnv = {}, cwd = ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`);
  }
}

function withDevClientExcluded(fn) {
  const original = fs.readFileSync(PKG_PATH, 'utf8');
  const pkg = JSON.parse(original);
  const prevExclude = pkg.expo?.autolinking?.exclude ?? [];
  pkg.expo = {
    ...(pkg.expo ?? {}),
    autolinking: {
      ...(pkg.expo?.autolinking ?? {}),
      exclude: [...new Set([...prevExclude, ...DEV_CLIENT_PACKAGES])],
    },
  };
  fs.writeFileSync(PKG_PATH, `${JSON.stringify(pkg, null, 2)}\n`);
  try {
    fn();
  } finally {
    fs.writeFileSync(PKG_PATH, original);
  }
}

loadEnvFile(path.join(ROOT, '.env'));

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
  );
}
if (/localhost|127\.0\.0\.1/i.test(supabaseUrl)) {
  throw new Error('Refusing to build an APK against localhost Supabase.');
}
if (!fs.existsSync(ANDROID_SDK)) {
  throw new Error(`Android SDK not found at ${ANDROID_SDK}`);
}

const testArch = process.env.MERIBAARI_TEST_ARCH || '';
const abi = testArch || 'arm64-v8a';
const destApk = testArch ? TEST_APK : OUT_APK;

const productionEnv = {
  MERIBAARI_PRODUCTION_APK: '1',
  NODE_ENV: 'production',
  CI: '1',
  ANDROID_HOME: ANDROID_SDK,
  ANDROID_SDK_ROOT: ANDROID_SDK,
  GRADLE_USER_HOME:
    process.env.GRADLE_USER_HOME || path.join(ROOT, '.gradle-home'),
};

fs.mkdirSync(path.join(ROOT, 'builds'), { recursive: true });
fs.mkdirSync(productionEnv.GRADLE_USER_HOME, { recursive: true });

console.log(
  `Building standalone APK (host=${new URL(supabaseUrl).host}, ${abi}, no dev client)`,
);

run('powershell', ['-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'scripts', 'sync-mobile-brand-assets.ps1')], productionEnv);

withDevClientExcluded(() => {
  if (process.env.SKIP_PREBUILD !== '1') {
    run('npx', ['expo', 'prebuild', '--platform', 'android'], productionEnv);
  }
  const gradleArgs = ['app:assembleRelease', '--no-daemon'];
  if (testArch) {
    gradleArgs.push(`-PreactNativeArchitectures=${testArch}`);
  }
  run(
    process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
    gradleArgs,
    productionEnv,
    path.join(ROOT, 'android'),
  );
});

const src = path.join(
  ROOT,
  'android',
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk',
);
if (!fs.existsSync(src)) {
  throw new Error(`Gradle did not produce ${src}`);
}
fs.copyFileSync(src, destApk);
const size = fs.statSync(destApk).size;
const sizeMb = (size / (1024 * 1024)).toFixed(2);
console.log(`Wrote ${destApk} (${sizeMb} MB)`);
if (!testArch && size >= MAX_BYTES) {
  throw new Error(
    `APK is ${sizeMb} MB; must be under 50 MB for the Supabase Storage limit.`,
  );
}
