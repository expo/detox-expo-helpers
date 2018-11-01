const { UrlUtils } = require('xdl');
const fs = require('fs');
const semver = require('semver');

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

const reloadApp = async (params) => {
  const url = await getAppUrl();
  const formattedBlacklistArg = await blacklistCmdlineFormat(params.urlBlacklist);
  await device.launchApp({
    permissions: params && params.permissions,
    newInstance: true,
    url,
    sourceApp: 'host.exp.exponent',
    launchArgs: { EXKernelDisableNuxDefaultsKey: true, detoxURLBlacklistRegex: formattedBlacklistArg },
  });

  const detoxVersion = getDetoxVersion();
  if (semver.lt(getDetoxVersion(), '9.0.6')){
    await blacklistLiveReloadUrl(params.urlBlacklist);
  }
};

const getDetoxVersion = () => {
  const detoxAppPath = path.join(process.cwd(), 'node_modules/detox');
  const detoxPackageJsonPath = path.join(detoxAppPath, 'package.json');

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
