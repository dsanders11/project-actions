// Modified from: https://github.com/actions/github-script/
// Copyright GitHub, Inc. and contributors

/* eslint-disable @typescript-eslint/no-explicit-any, no-undef, import/named */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { context } from '@actions/github';
import { defaults as defaultGitHubOptions } from '@actions/github/lib/utils';
import * as glob from '@actions/glob';
import * as io from '@actions/io';
import { Octokit } from '@octokit/core';
import type {
  OctokitOptions,
  OctokitPlugin
} from '@octokit/core/dist-types/types';
import { requestLog } from '@octokit/plugin-request-log';
import { retry } from '@octokit/plugin-retry';
import type { RequestRequestOptions } from '@octokit/types';
import { callAsyncFunction } from './async-function';
import {
  RetryOptions,
  getRetryOptions,
  parseNumberArray
} from './retry-options';
import { wrapRequire } from './wrap-require';

import {
  addItem,
  archiveItem,
  closeProject,
  copyProject,
  deleteItem,
  deleteProject,
  editItem,
  editProject,
  getAllItems,
  getDraftIssues,
  getItem,
  getProject,
  linkProjectToRepository,
  linkProjectToTeam
} from '../lib';

declare const __non_webpack_require__: NodeRequire;

type Options = {
  log?: Console;
  userAgent?: string;
  previews?: string[];
  retry?: RetryOptions;
  request?: RequestRequestOptions;
};

export function getOctokit(
  token: string,
  options?: OctokitOptions,
  ...additionalPlugins: OctokitPlugin[]
): Octokit {
  const MyOctokit = Octokit.plugin(...additionalPlugins);

  return new MyOctokit({ ...options, auth: token });
}

export async function main(): Promise<void> {
  const token = core.getInput('token', { required: true });
  const debug = core.getBooleanInput('debug');
  const userAgent = core.getInput('user-agent');
  const previews = core.getInput('previews');
  const retries = parseInt(core.getInput('retries'));
  const exemptStatusCodes = parseNumberArray(
    core.getInput('retry-exempt-status-codes')
  );
  const [retryOpts, requestOpts] = getRetryOptions(
    retries,
    exemptStatusCodes,
    defaultGitHubOptions
  );

  const opts: Options = {
    log: debug ? console : undefined,
    userAgent: userAgent || undefined,
    previews: previews ? previews.split(',') : undefined,
    retry: retryOpts,
    request: requestOpts
  };

  const github = getOctokit(token, opts, retry, requestLog);
  const script = core.getInput('script', { required: true });

  // Using property/value shorthand on `require` (e.g. `{require}`) causes compilation errors.
  const result = await callAsyncFunction(
    {
      require: wrapRequire,
      __original_require__: __non_webpack_require__,
      actions: {
        addItem,
        archiveItem,
        closeProject,
        copyProject,
        deleteItem,
        deleteProject,
        editItem,
        editProject,
        getAllItems,
        getDraftIssues,
        getItem,
        getProject,
        linkProjectToRepository,
        linkProjectToTeam
      },
      github,
      context,
      core,
      exec,
      glob,
      io
    },
    script
  );

  let encoding = core.getInput('result-encoding');
  encoding = encoding ? encoding : 'json';

  let output;

  switch (encoding) {
    case 'json':
      output = JSON.stringify(result);
      break;
    case 'string':
      output = String(result);
      break;
    default:
      throw new Error('"result-encoding" must be either "string" or "json"');
  }

  core.setOutput('result', output);
}
