import { render } from 'ink';
import React from 'react';
import yParser from 'yargs-parser';
import { App } from './ui';

const args = yParser(process.argv.slice(2), {});
render(
  React.createElement(App, {
    args,
  }),
);
