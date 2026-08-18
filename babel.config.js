module.exports = function (api) {
  api.cache.using(
    () =>
      `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}:${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing'}:${process.env.EXPO_PUBLIC_SENTRY_DSN ? 'sentry' : 'nosentry'}`,
  );
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
