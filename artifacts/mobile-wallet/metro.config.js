const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  ...config.watchFolders,
  monorepoRoot,
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.unstable_enablePackageExports = true;

config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      if (name === '@opentelemetry/api') {
        return path.resolve(projectRoot, '__mocks__/empty.js');
      }

      return path.join(
        projectRoot,
        'node_modules',
        String(name)
      );
    },
  }
);

module.exports = config;
