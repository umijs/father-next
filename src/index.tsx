import React from 'react';
import { render } from 'ink';
import yParser from 'yargs-parser';
import { App } from './ui';

const args = yParser(process.argv.slice(2), {});
render(<App args={args} />);
