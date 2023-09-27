import * as core from '@actions/core';

import {
  copyProject,
  editItem,
  editProject,
  getDraftIssues,
  linkProjectToRepository,
  linkProjectToTeam
} from './lib';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-commonjs
const Mustache = require('mustache'); // ESM confusion necessitates this

export async function copyProjectAction(): Promise<void> {
  try {
    // Required inputs
    const owner = core.getInput('owner', { required: true });
    const projectNumber = core.getInput('project-number', { required: true });
    const title = core.getInput('title', { required: true });

    // Optional inputs
    const drafts = core.getBooleanInput('drafts');
    const targetOwner = core.getInput('target-owner') || owner;
    const linkToRepository = core.getInput('link-to-repository');
    const linkToTeam = core.getInput('link-to-team');
    const templateViewString = core.getInput('template-view');

    if (!!templateViewString && !drafts) {
      core.setFailed(
        'Can only use template-view input if drafts are being copied'
      );
      return;
    }

    let templateView: Record<string, string> | null = null;

    if (templateViewString) {
      templateView = JSON.parse(templateViewString);
    }

    const project = await copyProject(
      owner,
      projectNumber,
      targetOwner,
      title,
      drafts
    );

    // This is a special case because core.getBooleanInput
    // will always return false even if not set, but we
    // need to know if the input has been set at all
    if (core.getInput('public')) {
      await editProject(project.owner.login, project.number.toString(), {
        public: core.getBooleanInput('public')
      });
    }

    if (linkToRepository) {
      await linkProjectToRepository(project.id, linkToRepository);
    }

    if (linkToTeam) {
      await linkProjectToTeam(project.id, linkToTeam);
    }

    // Do template interpolation on draft issues
    if (templateView) {
      const draftIssues = await getDraftIssues(project.id);

      for (const draftIssue of draftIssues) {
        try {
          const { content } = draftIssue;

          const newBody = Mustache.render(content.body, templateView);
          const newTitle = Mustache.render(content.title, templateView);

          // Only update the item if something changed
          if (newBody !== content.body || newTitle !== content.title) {
            await editItem(project.id, content.id, {
              body: newBody,
              title: newTitle
            });
          }

          // Check for field values to set, post-interpolation, in an HTML comment
          // with the following format:
          //
          // <!-- fields
          //   {
          //     "Start Date": "2023-11-01"
          //   }
          // -->
          const fieldsCommentMatch = newBody.match(
            /<!-- fields\s*({.*})\s*-->/s
          );

          if (fieldsCommentMatch) {
            const fieldValues: Record<string, string> = JSON.parse(
              fieldsCommentMatch[1]
            );

            for (const [field, fieldValue] of Object.entries(fieldValues)) {
              await editItem(project.id, draftIssue.id, { field, fieldValue });
            }
          }
        } catch (error) {
          let message = error?.toString();

          if (error instanceof Error) {
            message = error.message;
            if (error.stack) core.debug(error.stack);
          }

          core.error(
            `Error while doing template replacement on draft issue ${draftIssue.id}: ${message}`
          );
        }
      }
    }

    core.setOutput('closed', project.closed);
    core.setOutput('field-count', project.fields.totalCount);
    core.setOutput('id', project.id);
    core.setOutput('item-count', project.items.totalCount);
    core.setOutput('number', project.number);
    core.setOutput('owner', project.owner.login);
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
