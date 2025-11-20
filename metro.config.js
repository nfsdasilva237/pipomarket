// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Résolution pour packages problématiques
config.resolver = {
  ...config.resolver,
  // Exclure react-native-image-viewing du web bundle
  resolverMainFields: ['browser', 'react-native', 'main'],
  sourceExts: [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'],
};

module.exports = config;
