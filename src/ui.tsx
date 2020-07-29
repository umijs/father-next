import React, { useEffect } from 'react';
import { Static, Box, Newline, Text } from 'ink';
import { join } from 'path';
import yParser from 'yargs-parser';
import chalk from 'chalk';
import { useImmer } from 'use-immer';
import { register } from './register';
import { compatESModuleRequire } from './utils/compatESModuleRequire';
import { getConfig } from './utils/getConfig';
import { isLerna } from './utils/isLerna';
import { getLernaPackages } from './utils/getLernaPackages';
import { getPkgConfig } from './utils/getPkgConfig';
import { DEFAULT_PLATFORM } from './constants';
import bundle from './build/bundle';
import fileToFile from './build/fileToFile';
import { getFileName } from './utils/getFileName';
import { existsSync } from 'fs';

function getDataFromConfig(opts: {
  config: IConfig;
  package: string;
}): IUIPackage {
  return opts.config.formats!.reduce((memo, format) => {
    const isArr = Array.isArray(format);
    const formatType = (isArr ? format[0] : format) as IFormatType;
    const formatOpts = ((isArr && format[1]) || {}) as IFormatOpts;

    const base = {
      formatType: formatType,
      formatOpts: formatOpts,
      status: 'wait' as IUIStatus,
      package: opts.package,
      config: opts.config,
      platform: formatOpts.platform || opts.config.platform || DEFAULT_PLATFORM,
      bundle: false,
    };
    const bundle =
      formatType === 'umd' ||
      ('bundle' in formatOpts ? !!formatOpts['bundle'] : !!opts.config.bundle);

    if (bundle) {
      const entryPoints = formatOpts.entryPoints || {
        'src/index.ts': {},
      };
      Object.keys(entryPoints).forEach((fileName) => {
        const entryPointConfig = entryPoints[fileName];
        memo.push({
          ...base,
          entryPoint: fileName,
          targetFilePath: join(
            'dist',
            getFileName(fileName, {
              formatType,
            }),
          ),
          globalName: entryPointConfig.globalName || formatOpts.globalName,
          bundle,
          platform: entryPointConfig.platform || base.platform,
        });
      });
    } else {
      memo.push(base);
    }

    return memo;
  }, [] as IUIPackage);
}

function Package(props: { packageName: string; package: IUIPackage }) {
  return (
    <>
      <Text>
        <Text>[package] {props.packageName}</Text>
        <Newline />
        {props.package.map((item, index) => {
          return <Item item={item} key={index} />;
        })}
      </Text>
    </>
  );
}

function ItemError(props: { error: Error }) {
  return (
    <>
      <Text>{props.error.stack}</Text>
    </>
  );
}

function Item(props: { item: IUIItem }) {
  const errors = props.item.errors || {};
  return (
    <Text>
      <Text> - </Text>
      <Text>{`[${props.item.status}] `}</Text>
      <Text>{props.item.formatType}</Text>
      {props.item.entryPoint ? (
        <Text>
          {` (${props.item.entryPoint} -> ${props.item.targetFilePath})`}
        </Text>
      ) : (
        <Text>{` (${props.item.completed}/${props.item.total})`}</Text>
      )}
      {Object.keys(errors).map((key) => {
        return <ItemError key={key} error={errors[key]} />;
      })}
      <Newline />
    </Text>
  );
}

export function App(props: { args: yParser.Arguments }) {
  const [state, updateState] = useImmer<IUIState>({
    ready: false,
    packages: {},
  });

  function isItemEqual(src: IUIItem, dest: IUIItem) {
    return (
      src.bundle === dest.bundle &&
      src.formatType === dest.formatType &&
      (!src.bundle || src.filePath === dest.filePath)
    );
  }

  function updateHandler(
    targetItem: IUIItem,
    opts: {
      completed?: number;
      total?: number;
      status?: IUIStatus;
      error?: { key: string; error: Error };
      removeError?: string;
    },
  ) {
    updateState((draft) => {
      draft.packages[targetItem.package].forEach((item) => {
        if (isItemEqual(item, targetItem)) {
          if (opts.completed) item.completed = opts.completed;
          if (opts.total) item.total = opts.total;
          if (opts.status) item.status = opts.status;
          if (opts.error) {
            item.errors = {
              ...item.errors,
              [opts.error.key]: opts.error.error,
            };
            item.status = 'fail';
          }
          if (opts.removeError && item.errors) {
            delete item.errors[opts.removeError];
            if (!Object.keys(item.errors || {}).length) {
              item.status = 'success';
            }
          }
        }
      });
    });
  }

  async function init() {
    register();
    const cwd = process.cwd();
    const config = compatESModuleRequire(await getConfig({ cwd }));

    // TODO: Suggestion based on config and package.json

    const packages: {
      [name: string]: IUIPackage;
    } = {};
    if (isLerna(cwd)) {
      const pkgs = config.packages || getLernaPackages({ cwd });
      for (const pkg of pkgs) {
        const pkgConfig = getPkgConfig({ config, pkg });
        packages[pkg] = getDataFromConfig({
          config: pkgConfig,
          package: pkg,
        });
      }
    } else {
      packages['.'] = getDataFromConfig({ config, package: '.' });
    }

    updateState((draft) => {
      draft.ready = true;
      draft.packages = packages;
    });

    for (const pkg of Object.keys(packages)) {
      const data = packages[pkg];
      for (const item of data) {
        if (item.bundle) {
          await bundle({
            cwd: join(cwd, item.package),
            formatType: item.formatType,
            entryPoint: item.entryPoint!,
            targetFilePath: item.targetFilePath!,
            platform: item.platform,
            globalName: item.globalName,
            watch: props.args.watch,
            onUpdate: updateHandler.bind(null, item),
          });
        } else {
          await fileToFile({
            cwd: join(cwd, item.package),
            formatType: item.formatType,
            watch: props.args.watch,
            onUpdate: updateHandler.bind(null, item),
          });
        }
      }
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await init();
      } catch (e) {
        // console.error(chalk.red('Build failed'));
        // console.error(e);
      }
    })();
  }, []);

  if (!state.ready) return <Text>loading...</Text>;

  const packageNames = Object.keys(state.packages);

  return (
    <>
      {packageNames.map((packageName) => {
        return (
          <Package
            key={packageName}
            packageName={packageName}
            package={state.packages[packageName]}
          />
        );
      })}
    </>
  );
}
