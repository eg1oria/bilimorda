import 'server-only';

const localSiteUrl = 'http://localhost:3000';

export function getSiteUrl(): URL {
  const configuredUrl = process.env.SITE_URL?.trim();

  if (!configuredUrl && process.env.NODE_ENV === 'production') {
    throw new Error('SITE_URL must be configured for production builds');
  }

  const siteUrl = new URL(configuredUrl || localSiteUrl);

  if (!['http:', 'https:'].includes(siteUrl.protocol)) {
    throw new Error('SITE_URL must use the http or https protocol');
  }

  if (siteUrl.username || siteUrl.password) {
    throw new Error('SITE_URL must not contain credentials');
  }

  if (
    process.env.NODE_ENV === 'production' &&
    siteUrl.protocol !== 'https:' &&
    !['localhost', '127.0.0.1', '::1'].includes(siteUrl.hostname)
  ) {
    throw new Error('SITE_URL must use https in production');
  }

  if (siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
    throw new Error('SITE_URL must contain only the site origin, without a path, query, or hash');
  }

  return siteUrl;
}

export function getAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}
