export function getPkgConfig(opts: { config: IConfig; pkg: string }): IConfig {
  const overrideConfig = opts.config.overrides?.[opts.pkg];
  return {
    ...opts.config,
    ...overrideConfig,
  };
}
