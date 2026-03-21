import { setTimeout } from 'node:timers/promises';

import * as core from '@actions/core';

import {
  copyProject,
  DraftIssueItem,
  editItem,
  editProject,
  getDraftIssues,
  getProject,
  linkProjectToRepository,
  linkProjectToTeam,
  type ProjectEdit
} from './lib.js';

// oxlint-disable-next-line typescript/no-require-imports, typescript/no-var-requires
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

    const edit: ProjectEdit = {};

    // This is a special case because core.getBooleanInput
    // will always return false even if not set, but we
    // need to know if the input has been set at all
    if (core.getInput('public')) {
      edit.public = core.getBooleanInput('public');
    }

    // Do template interpolation on the project readme and description if a template view was provided
    if (templateView) {
      const newReadme = Mustache.render(project.readme, templateView);
      const newDescription = Mustache.render(
        project.shortDescription,
        templateView
      );

      if (newReadme !== project.readme) {
        edit.readme = newReadme;
      }

      if (newDescription !== project.shortDescription) {
        edit.description = newDescription;
      }
    }

    if (Object.keys(edit).length > 0) {
      await editProject(project.owner.login, project.number.toString(), edit);
    }

    if (linkToRepository) {
      await linkProjectToRepository(
        project.number.toString(),
        linkToRepository
      );
    }

    if (linkToTeam) {
      await linkProjectToTeam(project.number.toString(), linkToTeam);
    }

    // Do template interpolation on draft issues
    if (templateView) {
      // HACK - It seems that GitHub now populates the draft issues
      // on the new project in an async manner so they may not all
      // be available yet. Wait until the number of draft issues
      // matches the number of draft issues in the source project.
      const {
        items: { totalCount: draftIssueCount }
      } = await getProject(owner, projectNumber);

      let draftIssues: DraftIssueItem[] = [];

      for (let i = 0; i < 10; i++) {
        await setTimeout(1000);
        draftIssues = await getDraftIssues(project.id);
        if (draftIssues.length === draftIssueCount) break;
      }

      // Log an error but continue as partial success is better than failure
      if (draftIssues.length !== draftIssueCount) {
        core.error(
          `Not all draft issues available for interpolation, expected ${draftIssueCount} but got ${draftIssues.length}`
        );
      }

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
