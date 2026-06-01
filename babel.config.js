module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // babel-preset-expo automatically adds react-native-reanimated/plugin
    // when it detects the package — no need to add it manually here.
  };
};
