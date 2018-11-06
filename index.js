const { UrlUtils } = require('xdl');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const semver = require('semver');

const OSX_APP_PATH = path.join(os.homedir(), 'Library');
const OSX_LIBRARY_ROOT_PATH = path.join(OSX_APP_PATH, 'ExpoDetoxHook');

const expoDetoxHookAppPath = path.join(process.cwd(), 'node_modules/expo-detox-hook');
const expoDetoxHookPackageJsonPath = path.join(expoDetoxHookAppPath, 'package.json');

function getFrameworkPath() {
  const version = require(expoDetoxHookPackageJsonPath).version;
  let sha1 = cp.execSync(`(echo "${version}" && xcodebuild -version) | shasum | awk '{print $1}'`).toString().trim();
  return `${OSX_LIBRARY_ROOT_PATH}/ios/${sha1}/ExpoDetoxHook.framework/ExpoDetoxHook`;
}

let url;
const getAppUrl = async () => {
  if (!url) {
    url = await UrlUtils.constructManifestUrlAsync(process.cwd());
  }

  return url;
};

const getAppHttpUrl = async () => {
  const httpUrl = await UrlUtils.constructUrlAsync(
    process.cwd(),
    { urlType: 'http' },
    true
  );
  return httpUrl;
};

function resetEnvDyldVar(oldEnvVar) {
  if (oldEnvVar){
    // revert the env var to the old value
    process.env.SIMCTL_CHILD_DYLD_INSERT_LIBRARIES = oldVar;
  } else {
    // old env var was never defined, so we delete it
    delete process.env.SIMCTL_CHILD_DYLD_INSERT_LIBRARIES;
  }
}

const reloadApp = async (params) => {
  if (!fs.existsSync(expoDetoxHookPackageJsonPath)) {
    throw new Error("expo-detox-hook is not installed in this directory. You should declare it in package.json and run `npm install`");
  }

  const expoDetoxHookFrameworkPath = getFrameworkPath();

  if (!fs.existsSync(expoDetoxHookFrameworkPath)){
    throw new Error ("expo-detox-hook is not installed in your osx Library. Run `npm install -g expo-detox-cli && expotox clean-framework-cache && expotox build-framework-cache` to fix this.");
  }

  const detoxVersion = getDetoxVersion();
  const oldEnvVar = process.env.SIMCTL_CHILD_DYLD_INSERT_LIBRARIES;

  if (semver.gte(detoxVersion, '9.0.6')) {
    process.env.SIMCTL_CHILD_DYLD_INSERT_LIBRARIES = expoDetoxHookFrameworkPath;
  }

  const formattedBlacklistArg = await blacklistCmdlineFormat(params && params.urlBlacklist);
  const url = await getAppUrl();
  await device.launchApp({
    permissions: params && params.permissions,
    newInstance: true,
    url,
    sourceApp: 'host.exp.exponent',
    launchArgs: { EXKernelDisableNuxDefaultsKey: true, detoxURLBlacklistRegex: formattedBlacklistArg },
  });

  
  if (semver.lt(detoxVersion, '9.0.6')){ 
    // we will need to pass in blacklist again before it was supported at init in 9.0.6
    await blacklistLiveReloadUrl(params && params.urlBlacklist);
  } else {
    resetEnvDyldVar(oldEnvVar);
  }
};

const getDetoxVersion = () => {
  const detoxPackageJsonPath = path.join(process.cwd(), 'node_modules/detox/package.json');
  if (!fs.existsSync(detoxPackageJsonPath)) {
    throw new Error(`detox is not installed in this directory: ${detoxPackageJsonPath}`);
  }

  return require(detoxPackageJsonPath).version;
};

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

const getBlacklist = async () => {
  const httpUrl = await getAppHttpUrl();
  const liveReloadUrl = `${httpUrl}/onchange`;
  const fabricUrl = 'https://e.crashlytics.com/spi/v2/events';
  return [liveReloadUrl, fabricUrl];
};

// returns blacklist arg in format like \\("http://192.168.1.253:19001/onchange","https://e.crashlytics.com/spi/v2/events"\\)
const blacklistCmdlineFormat = async (userBlacklist) => {
  const expoBlacklist = await getBlacklist();
  const blacklist = userBlacklist ? expoBlacklist.concat(userBlacklist) : expoBlacklist;
  const cmdlineFormatBlacklist = blacklist.map(url => `"${url}"`).join(",");
  return `\\(${cmdlineFormatBlacklist}\\)`; 
};

const blacklistLiveReloadUrl = async (userBlacklist) => {
  const expoBlacklist = await getBlacklist();
  const blacklist = userBlacklist ? expoBlacklist.concat(userBlacklist) : expoBlacklist;
  const regexBlacklist = blacklist.map(url => escapeRegExp(url));
  await device.setURLBlacklist(regexBlacklist);
};

module.exports = {
  getAppUrl,
  getAppHttpUrl,
  blacklistLiveReloadUrl,
  reloadApp,
};
