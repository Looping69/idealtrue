import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { workflowMatrix } from './workflow-matrix.ts';

const currentFilePath = fileURLToPath(import.meta.url);
const testsDir = path.dirname(currentFilePath);
const repoRoot = path.resolve(testsDir, '..');

function repoFileExists(relativePath: string) {
  return existsSync(path.resolve(repoRoot, relativePath));
}

test('workflow matrix contains unique workflow ids with required operational metadata', () => {
  assert.ok(workflowMatrix.length >= 10);
  const ids = new Set<string>();

  for (const workflow of workflowMatrix) {
    assert.ok(workflow.id.trim().length > 0, 'workflow id is required');
    assert.ok(!ids.has(workflow.id), `duplicate workflow id: ${workflow.id}`);
    ids.add(workflow.id);

    assert.ok(workflow.workflow.trim().length > 0, `${workflow.id}: workflow label is required`);
    assert.ok(workflow.ownerArea.trim().length > 0, `${workflow.id}: owner area is required`);
    assert.ok(workflow.expectedOutcome.trim().length > 0, `${workflow.id}: expected outcome is required`);
    assert.ok(workflow.happyPath.trim().length > 0, `${workflow.id}: happy path is required`);
    assert.ok(workflow.keyRejectionPaths.length > 0, `${workflow.id}: key rejection paths are required`);
    assert.ok(workflow.roleRules.length > 0, `${workflow.id}: role rules are required`);
  }
});

test('workflow matrix references concrete files for entry points and coverage', () => {
  const missingPaths: string[] = [];

  for (const workflow of workflowMatrix) {
    const allPathReferences = [
      ...workflow.entryPoints,
      ...workflow.coverage.unitTests,
      ...workflow.coverage.contractTests,
      ...workflow.coverage.uiTests,
      ...workflow.coverage.e2eTests,
      ...workflow.coverage.backendWorkflowTests,
      ...workflow.coverage.coreFailurePathTests,
    ];

    for (const relativePath of allPathReferences) {
      if (!repoFileExists(relativePath)) {
        missingPaths.push(`${workflow.id}: ${relativePath}`);
      }
    }
  }

  assert.deepEqual(missingPaths, []);
});

test('each workflow has at least one automated path and one core failure-path mapping', () => {
  const offenders: string[] = [];

  for (const workflow of workflowMatrix) {
    const automatedCoverageCount =
      workflow.coverage.unitTests.length +
      workflow.coverage.contractTests.length +
      workflow.coverage.uiTests.length +
      workflow.coverage.e2eTests.length +
      workflow.coverage.backendWorkflowTests.length;

    if (automatedCoverageCount === 0 || workflow.coverage.coreFailurePathTests.length === 0) {
      offenders.push(workflow.id);
    }
  }

  assert.deepEqual(offenders, []);
});
