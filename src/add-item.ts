import * as core from '@actions/core';

import { addItem, editItem, getProject } from './lib';

export async function addItemAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const contentUrl = core.getInput('content-url', { required: true });

    // Optional inputs
    const field = core.getInput('field');
    const fieldValue = core.getInput('field-value', { required: !!field });

    if (!!fieldValue && !field) {
      core.setFailed('Input required and not supplied: field');
      return;
    }

    const itemId = await addItem(owner, projectNumber, contentUrl);

    if (fieldValue) {
      const project = await getProject(owner, projectNumber);

      // Project was just found above
      await editItem(project.id, itemId, {
        field,
        fieldValue
      });
    }

    core.setOutput('id', itemId);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
