interface IBasicConfig {
  platform?: IPlatform;
  bundle?: boolean;
}

type IFormatOpts = IBasicConfig & {
  entryPoints?: IEntryPoints;
  globalName?: string;
};
type IFormatType = 'cjs' | 'esm' | 'umd';
type IFormatWithOpts = [IFormatType, IFormatOpts];
type IFormat = IFormatType | IFormatWithOpts;
type IPlatform = 'node' | 'browser';

interface IEntryPoints {
  [entryPath: string]: IBasicConfig & {
    globalName?: string;
    targetFilePath?: string;
  };
}

type IConfig = IBasicConfig & {
  formats?: IFormat[];
  packages?: string[];
  overrides?: {
    [pkg: string]: Omit<IConfig, 'overrides'>;
  };
};

type IUIStatus = 'wait' | 'progress' | 'fail' | 'success';

interface IUIItem {
  formatType: IFormatType;
  formatOpts: IFormatOpts;
  status: IUIStatus;

  package: string;
  bundle: boolean;
  platform: IPlatform;
  config: IConfig;
  errors?: {
    [key: string]: Error;
  };

  // stream
  completed?: number;
  total?: number;

  // bundle
  filePath?: string;
  entryPoint?: string;
  globalName?: string;
  targetFilePath?: string;
}
type IUIPackage = IUIItem[];
interface IUIPackages {
  [name: string]: IUIPackage;
}

interface IUIState {
  ready: boolean;
  packages: IUIPackages;
}
