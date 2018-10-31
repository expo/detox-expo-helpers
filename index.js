const { UrlUtils } = require('xdl');

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
  const formattedBlacklistArg = await blacklistCmdlineFormat();
  await device.launchApp({
    permissions: params && params.permissions,
    newInstance: true,
    url,
    sourceApp: 'host.exp.exponent',
    launchArgs: { EXKernelDisableNuxDefaultsKey: true, detoxURLBlacklistRegex: formattedBlacklistArg },
  }); 
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
const blacklistCmdlineFormat = async () => {
  const blacklist = await getBlacklist();
  const cmdlineFormatBlacklist = blacklist.map(url => `"${url}"`).join(",");
  return `\\(${cmdlineFormatBlacklist}\\)`; 
};

const blacklistLiveReloadUrl = async () => {
  const blacklist = await getBlacklist();
  const regexBlacklist = blacklist.map(url => escapeRegExp(url));
  await device.setURLBlacklist(regexBlacklist);
};

module.exports = {
  getAppUrl,
  getAppHttpUrl,
  blacklistLiveReloadUrl,
  reloadApp,
};
