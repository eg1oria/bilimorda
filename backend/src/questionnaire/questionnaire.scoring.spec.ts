import { calculateQuestionnaireResult } from './questionnaire.scoring';

describe('calculateQuestionnaireResult', () => {
  it('returns a strong four-letter profile and keeps every percentage scale bounded', () => {
    const teamRoles = [
      'PLANT',
      'RESOURCE_INVESTIGATOR',
      'COORDINATOR',
      'SHAPER',
      'MONITOR_EVALUATOR',
      'TEAMWORKER',
      'IMPLEMENTER',
      'COMPLETER_FINISHER',
      'SPECIALIST',
    ].map((scoreTarget, index) => ({
      module: 'TEAM_ROLES',
      scoreTarget,
      reverseScored: false,
      value: index === 0 ? 5 : 1,
    }));
    const riasec = [
      ['R', 1],
      ['I', 2],
      ['A', 4],
      ['S', 3],
      ['E', 5],
      ['C', 1],
    ].map(([scoreTarget, value]) => ({
      module: 'RIASEC',
      scoreTarget: scoreTarget as string,
      reverseScored: false,
      value: value as number,
    }));

    const result = calculateQuestionnaireResult([
      ...teamRoles,
      { module: 'MBTI', scoreTarget: 'I', reverseScored: false, value: 5 },
      { module: 'MBTI', scoreTarget: 'N', reverseScored: false, value: 5 },
      { module: 'MBTI', scoreTarget: 'T', reverseScored: false, value: 5 },
      { module: 'MBTI', scoreTarget: 'J', reverseScored: false, value: 5 },
      ...riasec,
    ]);

    expect(result.algorithmVersion).toBe(3);
    expect(result.mbti.type).toBe('INTJ');
    expect(result.mbti.type).toMatch(/^[EISNTFJP]{4}$/);
    expect(result.mbti.axes).toHaveLength(4);
    for (const axis of result.mbti.axes) {
      expect(axis.leftPercent + axis.rightPercent).toBe(100);
      expect(axis.leftPercent).toBeGreaterThanOrEqual(0);
      expect(axis.rightPercent).toBeGreaterThanOrEqual(0);
    }
    expect(result.teamRoles[0]).toMatchObject({ code: 'PLANT', score: 100 });
    expect(result.riasec.code).toBe('EAS');
  });

  it('calculates direct, reverse and MBTI scores deterministically', () => {
    const result = calculateQuestionnaireResult(
      [
        {
          module: 'TEAM_ROLES',
          scoreTarget: 'PLANT',
          reverseScored: false,
          value: 5,
        },
        {
          module: 'TEAM_ROLES',
          scoreTarget: 'SHAPER',
          reverseScored: true,
          value: 5,
        },
        { module: 'MBTI', scoreTarget: 'E', reverseScored: false, value: 5 },
        { module: 'MBTI', scoreTarget: 'N', reverseScored: false, value: 5 },
        { module: 'MBTI', scoreTarget: 'T', reverseScored: false, value: 3 },
        { module: 'MBTI', scoreTarget: 'P', reverseScored: false, value: 1 },
        { module: 'RIASEC', scoreTarget: 'R', reverseScored: false, value: 5 },
        { module: 'RIASEC', scoreTarget: 'I', reverseScored: false, value: 4 },
        { module: 'RIASEC', scoreTarget: 'A', reverseScored: false, value: 3 },
        { module: 'RIASEC', scoreTarget: 'S', reverseScored: false, value: 2 },
        { module: 'RIASEC', scoreTarget: 'E', reverseScored: false, value: 1 },
        { module: 'RIASEC', scoreTarget: 'C', reverseScored: false, value: 1 },
      ],
      new Date('2026-07-22T12:00:00.000Z'),
    );

    expect(result.algorithmVersion).toBe(3);
    expect(result.computedAt).toBe('2026-07-22T12:00:00.000Z');
    expect(result.teamRoles.find((role) => role.code === 'PLANT')?.score).toBe(
      100,
    );
    expect(result.teamRoles.find((role) => role.code === 'SHAPER')?.score).toBe(
      0,
    );
    expect(result.mbti.type).toBe('ENTJ');
    expect(
      result.mbti.axes.every(
        (axis) => axis.leftPercent + axis.rightPercent === 100,
      ),
    ).toBe(true);
    expect(result.riasec.code).toBe('RIA');
    expect(result.entRecommendations.map((item) => item.code)).toEqual([
      'CHEMISTRY_PHYSICS',
      'BIOLOGY_GEOGRAPHY',
      'MATH_PHYSICS',
    ]);
  });

  it('returns a stable nearest type while preserving exact axis balance', () => {
    const result = calculateQuestionnaireResult([
      { module: 'MBTI', scoreTarget: 'E', reverseScored: false, value: 3 },
      { module: 'MBTI', scoreTarget: 'I', reverseScored: false, value: 3 },
      { module: 'MBTI', scoreTarget: 'S', reverseScored: false, value: 3 },
      { module: 'MBTI', scoreTarget: 'N', reverseScored: false, value: 3 },
      { module: 'MBTI', scoreTarget: 'T', reverseScored: false, value: 3 },
      { module: 'MBTI', scoreTarget: 'F', reverseScored: false, value: 3 },
      { module: 'MBTI', scoreTarget: 'J', reverseScored: false, value: 3 },
      { module: 'MBTI', scoreTarget: 'P', reverseScored: false, value: 3 },
    ]);

    expect(result.mbti.type).toBe('ESTJ');
    expect(result.mbti.axes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ axis: 'EI', letter: 'E', leftPercent: 50, rightPercent: 50 }),
        expect.objectContaining({ axis: 'SN', letter: 'S', leftPercent: 50, rightPercent: 50 }),
        expect.objectContaining({ axis: 'TF', letter: 'T', leftPercent: 50, rightPercent: 50 }),
        expect.objectContaining({ axis: 'JP', letter: 'J', leftPercent: 50, rightPercent: 50 }),
      ]),
    );
  });

  it('uses the declared RIASEC order to make a stable code when scores tie', () => {
    const result = calculateQuestionnaireResult(
      ['R', 'I', 'A', 'S', 'E', 'C'].map((scoreTarget) => ({
        module: 'RIASEC',
        scoreTarget,
        reverseScored: false,
        value: 4,
      })),
    );

    expect(result.riasec.code).toBe('RIA');
  });
});
