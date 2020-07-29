import foo from './foo';

interface IOpts {}

export default function (opts: IOpts) {
  const bar = new Bar();
  return foo(opts, bar);
}

class Bar {}
123;
