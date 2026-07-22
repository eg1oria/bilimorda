type Environment = Record<string, unknown>;

function requiredString(config: Environment, key: string) {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  if (value !== value.trim()) {
    throw new Error(`${key} must not contain leading or trailing whitespace`);
  }

  return value;
}

function parsePort(value: unknown) {
  if (value === undefined) return 3001;

  const port =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value.trim())
        ? Number(value)
        : Number.NaN;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

export function validateEnvironment(config: Environment) {
  const host = config.HOST ?? '127.0.0.1';

  if (typeof host !== 'string' || host.trim().length === 0) {
    throw new Error('HOST must be a non-empty string');
  }

  return {
    ...config,
    DATABASE_URL: requiredString(config, 'DATABASE_URL'),
    ADMIN_API_KEY: requiredString(config, 'ADMIN_API_KEY'),
    PORT: parsePort(config.PORT),
    HOST: host.trim(),
  };
}
