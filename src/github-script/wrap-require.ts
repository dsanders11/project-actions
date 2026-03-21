// Modified from: https://github.com/actions/github-script/
// Copyright GitHub, Inc. and contributors

/* eslint-disable no-undef */

import { createRequire } from 'node:module';
import * as path from 'node:path';

export const nativeRequire = createRequire(import.meta.url);

export const wrapRequire = new Proxy(nativeRequire, {
  apply: (target, thisArg, [moduleID]) => {
    if (moduleID.startsWith('.')) {
      moduleID = path.resolve(moduleID);
      return target.apply(thisArg, [moduleID]);
    }

    const modulePath = target.resolve.apply(thisArg, [
      moduleID,
      {
        // Resolve from the caller's working directory
        paths: [process.cwd()]
      }
    ]);

    return target.apply(thisArg, [modulePath]);
  },

  get: (target, prop, receiver) => {
    Reflect.get(target, prop, receiver);
  }
});
