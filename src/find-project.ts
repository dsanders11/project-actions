import * as core from '@actions/core';

import { findProject } from './lib.js';

export async function findProjectAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const title = core.getInput('title', { required: true });

    const project = await findProject(owner, title);

    if (!project) {
      core.setFailed(`Project not found: ${title}`);
      return;
    }

    core.setOutput('closed', project.closed);
    core.setOutput('field-count', project.fields.totalCount);
    core.setOutput('id', project.id);
    core.setOutput('item-count', project.items.totalCount);
    core.setOutput('number', project.number);
    core.setOutput('public', project.public);
    core.setOutput('readme', project.readme);
    core.setOutput('description', project.shortDescription);
    core.setOutput('title', project.title);
    core.setOutput('url', project.url);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
