// Modified from: https://github.com/actions/github-script/
// Copyright GitHub, Inc. and contributors

/* eslint-disable no-undef */

import * as path from 'node:path';

declare const __non_webpack_require__: NodeRequire;

export const wrapRequire = new Proxy(__non_webpack_require__, {
  apply: (target, thisArg, [moduleID]) => {
    if (moduleID.startsWith('.')) {
      moduleID = path.resolve(moduleID);
      return target.apply(thisArg, [moduleID]);
    }

    const modulePath = target.resolve.apply(thisArg, [
      moduleID,
      {
        // Webpack does not have an escape hatch for getting the actual
        // module, other than `eval`.
        paths: [process.cwd()]
      }
    ]);

    return target.apply(thisArg, [modulePath]);
  },

  get: (target, prop, receiver) => {
    Reflect.get(target, prop, receiver);
  }
});
