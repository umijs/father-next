import * as cli from '../src/cli/cli';

test(`version`, async () => {
  const spy = jest.spyOn(global.console, 'log');
  await cli.run({
    args: { _: ['version'], $0: 'node' },
  });
  const version = require('../package.json').version;
  expect(global.console.log).toHaveBeenCalledWith(
    `\u001B[36minfo\u001B[39m  -`,
    `Version: father@${version}`,
  );
  spy.mockRestore();
});
