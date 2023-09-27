import * as core from '@actions/core';

import { getItem } from './lib';

export async function getItemAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const item = core.getInput('item', { required: true });

    // Optional inputs
    const field = core.getInput('field') || undefined;

    // Item might be the item ID, the content ID, or the content URL
    const fullItem = await getItem(owner, projectNumber, item, field);

    if (!fullItem) {
      core.setFailed(`Item not found: ${item}`);
      return;
    }

    core.setOutput('id', fullItem.id);
    core.setOutput('body', fullItem.content.body);
    core.setOutput('content-id', fullItem.content.id);
    core.setOutput('project-id', fullItem.projectId);
    core.setOutput('title', fullItem.content.title);

    if (fullItem.content.type !== 'DraftIssue') {
      core.setOutput('url', fullItem.content.url);
    }

    if (fullItem.field) {
      core.setOutput('field-id', fullItem.field.id);

      if (fullItem.field.value !== null) {
        core.setOutput('field-value', fullItem.field.value);
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
