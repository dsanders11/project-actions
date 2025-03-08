/* eslint-disable github/no-then */

import * as core from '@actions/core';

import { main } from '../src/github-script/main.js';

process.on('unhandledRejection', handleError);
main().catch(handleError);

function handleError(err: unknown): void {
  console.error(err);
  core.setFailed(`Unhandled error: ${err}`);
}
