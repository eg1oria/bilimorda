import { validateEnvironment } from './configuration';

const validEnvironment = {
  DATABASE_URL: 'file:./test.db',
  ADMIN_API_KEY: 'test-admin-api-key',
};

describe('validateEnvironment', () => {
  it('adds safe network defaults', () => {
    expect(validateEnvironment(validEnvironment)).toMatchObject({
      ...validEnvironment,
      PORT: 3001,
      HOST: '127.0.0.1',
    });
  });

  it('converts a valid configured port to a number', () => {
    expect(
      validateEnvironment({
        ...validEnvironment,
        PORT: '4100',
        HOST: 'localhost',
      }),
    ).toMatchObject({ PORT: 4100, HOST: 'localhost' });
  });

  it.each([0, 65_536, '3001.5', 'not-a-port', ''])(
    'rejects invalid PORT %p',
    (PORT) => {
      expect(() => validateEnvironment({ ...validEnvironment, PORT })).toThrow(
        'PORT must be an integer between 1 and 65535',
      );
    },
  );

  it.each(['DATABASE_URL', 'ADMIN_API_KEY'])('requires %s', (key) => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, [key]: '   ' }),
    ).toThrow(`Missing required environment variable: ${key}`);
  });

  it('rejects an empty HOST', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, HOST: '   ' }),
    ).toThrow('HOST must be a non-empty string');
  });
});
