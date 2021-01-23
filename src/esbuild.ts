import { Service, startService } from 'esbuild';

let service: Service;

export async function start() {
  if (!service) {
    service = await startService();
  }
}

export async function transform(opts: { code: string; sourcefile: string }) {
  return await service.transform(opts.code, {
    sourcefile: opts.sourcefile,
  });
}

export async function build(opts: { entryPoints: string[]; args?: any }) {
  return await service.build({
    write: false,
    entryPoints: opts.entryPoints,
    ...opts.args,
  });
}

export function getService() {
  return service;
}

export async function stop() {
  if (service) {
    await service.stop();
  }

  // @ts-ignore
  service = null;
}
