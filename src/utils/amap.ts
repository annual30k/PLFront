import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_VERSION = '2.0';
const AMAP_PLUGINS = ['AMap.Scale', 'AMap.ToolBar', 'AMap.MarkerCluster'];

let amapPromise: Promise<any> | undefined;

const getAMapEnv = () => {
  const key = import.meta.env.VITE_AMAP_KEY?.trim();
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_CODE?.trim();

  if (!key) {
    throw new Error('VITE_AMAP_KEY is required');
  }

  return {
    key,
    securityJsCode
  };
};

export const loadAMap = () => {
  if (amapPromise) {
    return amapPromise;
  }

  const { key, securityJsCode } = getAMapEnv();

  if (securityJsCode) {
    window._AMapSecurityConfig = {
      securityJsCode
    };
  }

  amapPromise = AMapLoader.load({
    key,
    version: AMAP_VERSION,
    plugins: AMAP_PLUGINS
  });

  return amapPromise;
};
