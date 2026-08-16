/**
 * Install a release APK on the local emulator, launch it, and fail if it dies.
 */
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SDK =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
const ADB = path.join(SDK, 'platform-tools', 'adb.exe');
const EMULATOR = path.join(SDK, 'emulator', 'emulator.exe');
const AVDMANAGER = path.join(
  SDK,
  'cmdline-tools',
  'latest',
  'bin',
  'avdmanager.bat',
);
const AVD_NAME = 'MeriBaariTest';
const PACKAGE = 'app.meribaari.mobile';
const APK =
  process.argv[2] ||
  path.join(ROOT, 'builds', 'MeriBaari-emulator-test.apk');

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32' && command.endsWith('.bat'),
    ...opts,
  });
  return result;
}

function adb(args) {
  return run(ADB, args);
}

function sleep(ms) {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${ms})`], {
    stdio: 'ignore',
  });
}

if (!fs.existsSync(APK)) {
  throw new Error(`APK not found: ${APK}`);
}
if (!fs.existsSync(ADB)) {
  throw new Error(`adb not found at ${ADB}`);
}

let devices = adb(['devices']).stdout || '';
if (!/emulator-\d+\s+device/.test(devices)) {
  const avds = run(EMULATOR, ['-list-avds']).stdout || '';
  if (!avds.split(/\r?\n/).includes(AVD_NAME)) {
    console.log(`Creating AVD ${AVD_NAME}...`);
    const created = run(
      AVDMANAGER,
      [
        'create',
        'avd',
        '--force',
        '--name',
        AVD_NAME,
        '--package',
        'system-images;android-34;google_apis;x86_64',
        '--device',
        'pixel_7',
      ],
      { input: 'no\n', encoding: 'utf8' },
    );
    if (created.status !== 0) {
      console.error(created.stderr || created.stdout);
      process.exit(created.status ?? 1);
    }
  }
  console.log('Starting emulator...');
  const child = spawn(
    EMULATOR,
    ['-avd', AVD_NAME, '-netdelay', 'none', '-netspeed', 'full', '-no-snapshot-save'],
    { detached: true, stdio: 'ignore' },
  );
  child.unref();
  const started = Date.now();
  while (Date.now() - started < 180000) {
    sleep(5000);
    devices = adb(['devices']).stdout || '';
    if (/emulator-\d+\s+device/.test(devices)) break;
  }
}

const wait = adb(['wait-for-device']);
if (wait.status !== 0) {
  throw new Error('No emulator/device became ready');
}

const bootDeadline = Date.now() + 180000;
while (Date.now() < bootDeadline) {
  const boot = adb(['shell', 'getprop', 'sys.boot_completed']);
  if ((boot.stdout || '').trim() === '1') break;
  sleep(3000);
}

console.log(`Installing ${APK}`);
adb(['uninstall', PACKAGE]);
const install = adb(['install', '-r', APK]);
console.log(install.stdout || '');
if (install.status !== 0) {
  console.error(install.stderr || '');
  process.exit(install.status ?? 1);
}

adb(['logcat', '-c']);
const launch = adb([
  'shell',
  'am',
  'start',
  '-W',
  '-n',
  `${PACKAGE}/.MainActivity`,
]);
console.log(launch.stdout || '');
sleep(12000);

const pid = (adb(['shell', 'pidof', PACKAGE]).stdout || '').trim();
const log = adb([
  'logcat',
  '-d',
  '-t',
  '250',
  'AndroidRuntime:E',
  'ReactNative:E',
  'ReactNativeJS:E',
  'SoLoader:E',
  'Expo:E',
  '*:F',
]).stdout || '';

console.log('--- pid ---');
console.log(pid || '(not running)');
console.log('--- logcat errors ---');
console.log(log);

const fatal = /FATAL EXCEPTION|AndroidRuntime:.*Error|SoLoaderDSONotFound|Unable to load script|MeriBaari fatal/.test(
  log,
);
if (!pid || fatal) {
  console.error('App did not stay running after launch.');
  process.exit(1);
}
console.log('Emulator launch OK — process still running, no fatal log.');
