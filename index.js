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
  await device.launchApp({
    permissions: params && params.permissions,
    newInstance: true,
    url,
    sourceApp: 'host.exp.exponent',
    launchArgs: { EXKernelDisableNuxDefaultsKey: true },
  });
  await blacklistLiveReloadUrl();
};

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

const blacklistLiveReloadUrl = async () => {
  const httpUrl = await getAppHttpUrl();
  const liveReloadUrl = `${httpUrl}/onchange`;
  const fabricUrl = 'https://e.crashlytics.com/spi/v2/events';
  await device.setURLBlacklist([
    escapeRegExp(liveReloadUrl),
    escapeRegExp(fabricUrl),
  ]);
};

module.exports = {
  getAppUrl,
  getAppHttpUrl,
  blacklistLiveReloadUrl,
  reloadApp,
};
