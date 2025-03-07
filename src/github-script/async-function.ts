// Modified from: https://github.com/actions/github-script/
// Copyright GitHub, Inc. and contributors

/* eslint-disable no-undef */

import * as core from '@actions/core';
import { Octokit } from '@octokit/core';
import * as exec from '@actions/exec';
import { Context } from '@actions/github/lib/context.js';
import * as glob from '@actions/glob';
import * as io from '@actions/io';

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

const AsyncFunction = Object.getPrototypeOf(async () => null).constructor;

type ProjectActions = {
  addItem: typeof addItem;
  archiveItem: typeof archiveItem;
  closeProject: typeof closeProject;
  copyProject: typeof copyProject;
  deleteItem: typeof deleteItem;
  deleteProject: typeof deleteProject;
  editItem: typeof editItem;
  editProject: typeof editProject;
  findProject: typeof findProject;
  findWorkflow: typeof findWorkflow;
  getAllItems: typeof getAllItems;
  getDraftIssues: typeof getDraftIssues;
  getItem: typeof getItem;
  getProject: typeof getProject;
  getWorkflow: typeof getWorkflow;
  linkProjectToRepository: typeof linkProjectToRepository;
  linkProjectToTeam: typeof linkProjectToTeam;
};

type AsyncFunctionArguments = {
  actions: ProjectActions;
  context: Context;
  core: typeof core;
  github: Octokit;
  exec: typeof exec;
  glob: typeof glob;
  io: typeof io;
  require: NodeRequire;
  __original_require__: NodeRequire;
};

export async function callAsyncFunction<T>(
  args: AsyncFunctionArguments,
  source: string
): Promise<T> {
  const fn = new AsyncFunction(...Object.keys(args), source);
  return fn(...Object.values(args));
}
