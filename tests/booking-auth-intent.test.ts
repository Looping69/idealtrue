import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAuthPathWithReturn, buildPlannerAuthPath, buildPlannerReturnPath } from '../src/lib/booking-auth-intent.ts';

test('buildPlannerReturnPath preserves the planner query', () => {
  assert.equal(buildPlannerReturnPath('Plan a Durban weekend'), '/planner?q=Plan+a+Durban+weekend');
  assert.equal(buildPlannerReturnPath(''), '/planner');
});

test('buildPlannerAuthPath routes through signup with planner intent', () => {
  assert.equal(
    buildPlannerAuthPath('Luxury stays in Durban'),
    '/signup?intent=planner&returnTo=%2Fplanner%3Fq%3DLuxury%2Bstays%2Bin%2BDurban',
  );
});

test('buildAuthPathWithReturn works without an explicit intent', () => {
  assert.equal(buildAuthPathWithReturn('/guest'), '/signup?returnTo=%2Fguest');
});
