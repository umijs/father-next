if (!/pnpm/.test(process.env.npm_execpath || '')) {
  console.warn(
    `\u001b[33mThis repository must be installed using PNPM.\u001b[39m\n`,
  );
  process.exit(1);
}
