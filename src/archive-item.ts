import * as core from '@actions/core';

import { archiveItem, getItem } from './lib';

export async function archiveItemAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const item = core.getInput('item', { required: true });

    // Optional inputs
    const archived = core.getBooleanInput('archived');
    const failIfItemNotFound = core.getBooleanInput('fail-if-item-not-found');

    // Item might be the item ID, the content ID, or the content URL
    const fullItem = await getItem(owner, projectNumber, item);

    if (!fullItem) {
      if (failIfItemNotFound) core.setFailed(`Item not found: ${item}`);
      return;
    }

    await archiveItem(owner, projectNumber, fullItem.id, archived);

    core.setOutput('id', fullItem.id);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error && error.stack) core.debug(error.stack);
    core.setFailed(
      error instanceof Error ? error.message : JSON.stringify(error)
    );
  }
}
