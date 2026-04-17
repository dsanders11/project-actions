// Modified from: https://github.com/actions/github-script/
// Copyright GitHub, Inc. and contributors

/* oxlint-disable typescript/no-explicit-any, no-undef */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { context, getOctokit } from '@actions/github';
import { defaults as defaultGitHubOptions } from '@actions/github/lib/utils';
import * as glob from '@actions/glob';
import * as io from '@actions/io';
import { requestLog } from '@octokit/plugin-request-log';
import { retry } from '@octokit/plugin-retry';
import type { RequestRequestOptions } from '@octokit/types';
import { callAsyncFunction } from './async-function.js';
import {
  RetryOptions,
  getRetryOptions,
  parseNumberArray
} from './retry-options.js';
import { nativeRequire, wrapRequire } from './wrap-require.js';

import {
  addItem,
  archiveItem,
  closeProject,
  copyProject,
  deleteItem,
  deleteProject,
  editItem,
  editProject,
  findProject,
  findWorkflow,
  getAllItems,
  getDraftIssues,
  getItem,
  getProject,
  getWorkflow,
  linkProjectToRepository,
  linkProjectToTeam
} from '../lib.js';

type Options = {
  log?: Console;
  userAgent?: string;
  baseUrl?: string;
  previews?: string[];
  retry?: RetryOptions;
  request?: RequestRequestOptions;
};

export async function main(): Promise<void> {
  const token = core.getInput('token', { required: true });
  const debug = core.getBooleanInput('debug');
  const userAgent = core.getInput('user-agent');
  const previews = core.getInput('previews');
  const baseUrl = core.getInput('base-url');
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

  // Setting `baseUrl` to undefined will prevent the default value from being used
  // https://github.com/actions/github-script/issues/436
  if (baseUrl) {
    opts.baseUrl = baseUrl;
  }

  const github = getOctokit(token, opts, retry, requestLog);
  const script = core.getInput('script', { required: true });

  // Using property/value shorthand on `require` (e.g. `{require}`) causes compilation errors.
  const result = await callAsyncFunction(
    {
      require: wrapRequire,
      __original_require__: nativeRequire,
      actions: {
        addItem,
        archiveItem,
        closeProject,
        copyProject,
        deleteItem,
        deleteProject,
        editItem,
        editProject,
        findProject,
        findWorkflow,
        getAllItems,
        getDraftIssues,
        getItem,
        getProject,
        getWorkflow,
        linkProjectToRepository,
        linkProjectToTeam
      },
      github,
      octokit: github,
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
