import * as core from '@actions/core';

import { getProject } from './lib';

export async function getProjectAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });

    const project = await getProject(owner, projectNumber);

    core.setOutput('closed', project.closed);
    core.setOutput('field-count', project.fields.totalCount);
    core.setOutput('id', project.id);
    core.setOutput('item-count', project.items.totalCount);
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
