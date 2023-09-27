import * as core from '@actions/core';

import { closeProject } from './lib';

export async function closeProjectAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });

    // Optional inputs
    const closed = core.getBooleanInput('closed');

    const project = await closeProject(owner, projectNumber, closed);

    core.setOutput('id', project.id);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
