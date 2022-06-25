import * as cli from '../src/cli/cli';

const spy = jest.spyOn(console, 'log');

afterAll(() => {
  spy.mockRestore();
});

test('help: all commands', async () => {
  await cli.run({
    args: { _: ['help'], $0: 'node' },
  });

  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Commands'));
});

test('help: build sub command', async () => {
  await cli.run({
    args: { _: ['help', 'build'], $0: 'node' },
  });

  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('--no-clean'),
  );
});
