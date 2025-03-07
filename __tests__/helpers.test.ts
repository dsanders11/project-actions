import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import { Octokit } from '@octokit/core';

import * as helpers from '../src/helpers.js';
import { mockGetInput, overridePlatform, resetPlatform } from './utils.js';

vi.mock('@actions/core');
vi.mock('@actions/exec');
vi.mock('@actions/tool-cache');
vi.mock('@octokit/core', () => ({
  Octokit: {
    plugin: vi.fn()
  }
}));
vi.mock('@octokit/plugin-paginate-graphql');

describe('helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('installGhCli', () => {
    beforeEach(() => {
      overridePlatform('linux');
    });

    afterEach(() => {
      resetPlatform();
    });

    it('throws an error on non-Linux platforms', async () => {
      overridePlatform('win32');
      await expect(helpers.installGhCli()).rejects.toThrow(
        'Only Linux runners have support at the moment'
      );
    });

    it('checks cache for gh', async () => {
      vi.mocked(tc.find).mockReturnValue('/path/to/tool/');
      await expect(helpers.installGhCli()).resolves.toEqual(
        '/path/to/tool/bin/gh'
      );
      expect(tc.find).toHaveBeenCalledWith('gh', expect.anything());
    });

    it('downloads and caches gh', async () => {
      vi.mocked(tc.find).mockReturnValue('');
      vi.mocked(tc.downloadTool).mockResolvedValue('/path/to/download.tar.gz');
      vi.mocked(tc.extractTar).mockResolvedValue('/path/to/extracted/');
      vi.mocked(tc.cacheDir).mockResolvedValue('/path/to/cached/');
      await expect(helpers.installGhCli()).resolves.toEqual(
        '/path/to/cached/bin/gh'
      );
      expect(tc.find).toHaveBeenCalledWith('gh', expect.anything());
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.extractTar).toHaveBeenCalledWith(
        '/path/to/download.tar.gz',
        undefined,
        expect.anything()
      );
      expect(tc.cacheDir).toHaveBeenCalledWith(
        '/path/to/extracted/',
        'gh',
        expect.anything()
      );
    });
  });

  describe('execCliCommand', () => {
    beforeEach(() => {
      overridePlatform('linux');
    });

    afterEach(() => {
      resetPlatform();
    });

    it('requires the token input', async () => {
      mockGetInput({});
      await expect(helpers.execCliCommand).rejects.toThrow(
        'Input required and not supplied: token'
      );
    });

    it('sets GH_TOKEN', async () => {
      const args = ['project', 'view'];
      const stdout = 'output';
      const token = 'gh-token';
      mockGetInput({ token });
      vi.mocked(exec.getExecOutput).mockResolvedValue({
        exitCode: 0,
        stdout,
        stderr: ''
      });
      await expect(helpers.execCliCommand(args)).resolves.toEqual(stdout);
      expect(exec.getExecOutput).toHaveBeenCalledWith(
        expect.anything(),
        args,
        expect.objectContaining({
          env: {
            GH_TOKEN: token
          }
        })
      );
    });

    it('sets GH_DEBUG if core.isDebug() is true', async () => {
      const args = ['project', 'view'];
      const stdout = 'output';
      const token = 'gh-token';
      mockGetInput({ token });
      vi.mocked(core.isDebug).mockReturnValue(true);
      vi.mocked(exec.getExecOutput).mockResolvedValue({
        exitCode: 0,
        stdout,
        stderr: ''
      });
      await expect(helpers.execCliCommand(args)).resolves.toEqual(stdout);
      expect(exec.getExecOutput).toHaveBeenCalledWith(
        expect.anything(),
        args,
        expect.objectContaining({
          env: {
            GH_DEBUG: 'api',
            GH_TOKEN: token
          }
        })
      );
    });

    it('throws error on non-zero exit code', async () => {
      const args = ['project', 'view'];
      const stdout = 'output';
      const stderr = 'my error';
      const token = 'gh-token';
      mockGetInput({ token });
      vi.mocked(exec.getExecOutput).mockResolvedValue({
        exitCode: 1,
        stdout,
        stderr
      });
      await expect(helpers.execCliCommand(args)).rejects.toThrow(stderr);
    });

    it('throws error on zero exit code if stderr with no stdout', async () => {
      const args = ['project', 'view'];
      const stdout = '';
      const stderr = 'my error';
      const token = 'gh-token';
      mockGetInput({ token });
      vi.mocked(exec.getExecOutput).mockResolvedValue({
        exitCode: 0,
        stdout,
        stderr
      });
      await expect(helpers.execCliCommand(args)).rejects.toThrow(stderr);
    });
  });

  describe('getOctokit', () => {
    it('requires the token input', () => {
      mockGetInput({});
      expect(helpers.getOctokit).toThrow(
        'Input required and not supplied: token'
      );
    });

    it('uses the auth token', () => {
      const token = 'auth-token';
      mockGetInput({ token });

      const mockOctokit = vi.fn();

      (Octokit.plugin as Mock).mockReturnValue(mockOctokit);

      helpers.getOctokit();
      expect(mockOctokit).toHaveBeenCalledWith({ auth: token });
    });
  });
});
