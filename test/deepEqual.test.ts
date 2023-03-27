/* eslint-disable jest/valid-title */
import { deepEqual } from '../src/deepEqual';
import { expect, describe, test } from 'vitest';

const obj1 = {
  foo: 'bar',
};

const arr1 = [1];

const cases: [
  name: string,
  tests: { name: string; a: any; b: any; result: boolean }[],
][] = [
  [
    'Single values',
    [
      {
        name: 'null is null',
        a: null,
        b: null,
        result: true,
      },
      {
        name: 'null is not {}',
        a: null,
        b: {},
        result: false,
      },
      {
        name: '1 is 1',
        a: 1,
        b: 1,
        result: true,
      },
      {
        name: '[] is []',
        a: [],
        b: [],
        result: true,
      },
      {
        name: '[] is not {}',
        a: [],
        b: {},
        result: false,
      },
      {
        name: 'NaN is NaN',
        a: NaN,
        b: NaN,
        result: true,
      },
    ],
  ],

  [
    'Simple objects',
    [
      {
        name: 'Same object',
        a: obj1,
        b: obj1,
        result: true,
      },
      {
        name: 'Single key',
        a: { foo: 'bar' },
        b: { foo: 'bar' },
        result: true,
      },
      {
        name: 'Single key not equal',
        a: { foo: 'bar' },
        b: { foo: 'bar2' },
        result: false,
      },
      {
        name: 'Multiple keys',
        a: { bar: 1, foo: 'bar', baz: false },
        b: { baz: false, foo: 'bar', bar: 1 },
        result: true,
      },
      {
        name: 'A has more keys',
        a: { foo: 1, bar: 2 },
        b: { foo: 1 },
        result: false,
      },
      {
        name: 'B has more keys',
        a: { foo: 1 },
        b: { foo: 1, bar: 2 },
        result: false,
      },
    ],
  ],
  [
    'Arrays objects',
    [
      {
        name: 'Same array',
        a: arr1,
        b: arr1,
        result: true,
      },
      {
        name: 'Single elem',
        a: ['bar'],
        b: ['bar'],
        result: true,
      },
      {
        name: 'Single elem not equal',
        a: ['bar'],
        b: ['bar2'],
        result: false,
      },
      {
        name: 'Multiple elems',
        a: [1, 'bar', false],
        b: [1, 'bar', false],
        result: true,
      },
      {
        name: 'A has more elems',
        a: [1, 2],
        b: [1],
        result: false,
      },
      {
        name: 'B has more keys',
        a: [1],
        b: [1, 2],
        result: false,
      },
    ],
  ],

  [
    'Deep objects',
    [
      {
        name: 'Simple one level - 1',
        a: {
          a: 1,
          b: {},
        },
        b: {
          a: 1,
          b: {},
        },
        result: true,
      },
      {
        name: 'Simple one level - 2',
        a: {
          a: 1,
          b: obj1,
        },
        b: {
          a: 1,
          b: obj1,
        },
        result: true,
      },
    ],
  ],
  [
    'Deep Arrays',
    [
      {
        name: 'Simple one level - 1',
        a: [1, []],
        b: [1, []],
        result: true,
      },
      {
        name: 'Simple one level - 2',
        a: [1, obj1],
        b: [1, obj1],
        result: true,
      },
    ],
  ],
  [
    'Map',
    [
      {
        name: 'Simple one level - 1',
        a: new Map<string, any>([
          ['a', 1],
          ['b', {}],
        ]),
        b: new Map<string, any>([
          ['a', 1],
          ['b', {}],
        ]),
        result: true,
      },
      {
        name: 'Simple one level - 2',
        a: new Map<string, any>([
          ['a', 1],
          ['b', obj1],
        ]),
        b: new Map<string, any>([
          ['a', 1],
          ['b', obj1],
        ]),
        result: true,
      },
    ],
  ],
  [
    'Set',
    [
      {
        name: 'Simple one level - 1',
        a: new Set([1, {}]),
        b: new Set([1, {}]),
        result: true,
      },
      {
        name: 'Simple one level - 2',
        a: new Set([1, obj1]),
        b: new Set([1, obj1]),
        result: true,
      },
    ],
  ],
];

describe('deep equal', () => {
  function same(a: any, b: any) {
    expect(deepEqual(a, b)).toBe(true);
  }
  function different(a: any, b: any) {
    expect(deepEqual(a, b)).toBe(false);
  }

  cases.forEach(([name, tests]) => {
    describe(name, () => {
      tests.forEach(({ name: testName, a, b, result }) =>
        test(testName, () => expect(deepEqual(a, b)).toBe(result)),
      );
    });
  });

  test('single values, tests from dequal/lite', () => {
    different(1, 2);
    different(1, []);
    different(1, '1');
    same(Infinity, Infinity);
    different(Infinity, -Infinity);
    different(NaN, undefined);
    different(NaN, null);
    different(1, -1);
    same(0, -0);
    // eslint-disable-next-line no-void
    same(void 0, undefined);
    same(undefined, undefined);
    different(null, undefined);
    different('', null);
    different(0, null);
    same(true, true);
    same(false, false);
    different(true, false);
    different(0, false);
    different(1, true);
    same('a', 'a');
    different('a', 'b');

    same(new Date('sdfsdf'), new Date('sdfsdf'));

    different(new Date('2019-01-01'), new Date('2019-01-02'));
  });

  test('objects', () => {
    same({}, {});
    same({ a: 1, b: 2 }, { a: 1, b: 2 });
    same({ b: 2, a: 1 }, { a: 1, b: 2 });

    different({ a: 1, b: 2, c: [] }, { a: 1, b: 2 });
    different({ a: 1, b: 2 }, { a: 1, b: 2, c: [] });
    different({ a: 1, c: 3 }, { a: 1, b: 2 });

    same({ a: [{ b: 1 }] }, { a: [{ b: 1 }] });
    different({ a: [{ b: 2 }] }, { a: [{ b: 1 }] });
    different({ a: [{ c: 1 }] }, { a: [{ b: 1 }] });

    different([], {});
    different({}, []);
    different({}, null);
    different({}, undefined);

    different({ a: void 0 }, {});
    different({}, { a: undefined });
    different({ a: undefined }, { b: undefined });
  });

  test('Arrays', () => {
    same([], []);
    same([1, 2, 3], [1, 2, 3]);
    different([1, 2, 4], [1, 2, 3]);
    different([1, 2], [1, 2, 3]);

    same([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }]);
    different([{ a: 2 }, { b: 2 }], [{ a: 1 }, { b: 2 }]);

    different({ '0': 0, '1': 1, length: 2 }, [0, 1]);
  });

  test('maps nested', () => {
    const hello = new Map([
      ['foo', { a: 1 }],
      ['bar', [1, 2, 3]],
    ]);

    const world = new Map([['foo', 'bar']]);

    different(hello, world);

    world.set('foo', { a: 1 });
    different(hello, world);

    world.set('bar', [1, 2, 3]);
    same(hello, world);

    hello.set('baz', new Map([['hello', 'world']]));
    different(hello, world);

    world.set('baz', new Map([['hello', 'world']]));
    same(hello, world);
  });
});
