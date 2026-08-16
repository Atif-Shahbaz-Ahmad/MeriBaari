module.exports = function (api) {
  api.cache.using(
    () =>
      `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}:${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing'}`,
  );
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
