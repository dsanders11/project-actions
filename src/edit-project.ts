import * as core from '@actions/core';

import { ProjectEdit, editProject } from './lib';

export async function editProjectAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });

    // Optional inputs
    const title = core.getInput('title');
    const description = core.getInput('description');
    const readme = core.getInput('readme');

    const edit: ProjectEdit = {};

    if (title) edit.title = title;
    if (description) edit.description = description;
    if (readme) edit.readme = readme;

    // This is a special case because core.getBooleanInput
    // will always return false even if not set, but we
    // need to know if the input has been set at all
    if (core.getInput('public')) edit.public = core.getBooleanInput('public');

    const projectId = await editProject(owner, projectNumber, edit);

    core.setOutput('id', projectId);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
