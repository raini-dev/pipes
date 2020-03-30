# @raini/pipes

[![Build Status](https://travis-ci.org/Raini-js/pipes.svg?branch=master)](https://travis-ci.org/Raini-js/pipes)
[![codecov](https://codecov.io/gh/Raini-js/pipes/branch/master/graph/badge.svg)](https://codecov.io/gh/Raini-js/pipes)
[![npm](https://img.shields.io/npm/dt/@raini/pipes.svg)](https://www.npmjs.com/package/@raini/pipes)
[![npm](https://img.shields.io/npm/v/@raini/pipes.svg)](https://www.npmjs.com/package/@raini/pipes)
[![licence: MIT](https://img.shields.io/npm/l/@raini/pipes.svg)](https://github.com/raini/pipes)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![versioning: @priestine/semantics](https://img.shields.io/badge/versioning-@priestine/semantics-912e5c.svg)](https://github.com/priestine/semantics)

`@raini/pipes` is a set of composable blocks called Pipelines. Pipelines are lazy and do not get invoked until they are forked with `process` method.

Pipelines are Monoids and can be concatenated with other Pipelines using `p.concat` which allows joining separate sets of composed functions.

## Features

- Composition of functions via `pipe`
- Helper pipe methods, e.g. `pipeTap` or `extendPipe`
- Implements **Semigroup** (holds associativity) with `p.concat`
- Implements **Monoid** (holds right identity and left identity) with `p.concat` and `P.empty`
- PromisePipeline allows abstracting from using Promises in composed functions - `promisePipeline.process` returns the only Promise to work with
- Can be used both in Node and in browsers (transpiled to ES5)

## Installation

```shell script
npm i -S @raini/pipes
```

## Usage

### PromisePipeline

```typescript
import { PromisePipeline } from "@raini/pipes";
import * as rl from "readline";

const addSpaceIfMissing = (q: string): string => (q.endsWith(" ") ? q : q.concat(" "));
const toObject = (q: string) => ({ q });
const createReadLine = () => ({ rl: rl.createInterface(process.stdin, process.stdout) });
const askQuestionAsync = ({ rl, q }) => new Promise((res) => rl.question(q, (a: string) => res(a)));
const applyGreenColor = (x: string) => `\x1b[32m${x}\x1b[0m`;
const log = console.log;
const exit = () => process.exit(0);

PromisePipeline.of(addSpaceIfMissing)
  .pipe(toObject)
  .pipeExtend(createReadLine) // Extend argument object with return value
  .pipe(askQuestionAsync)
  .pipe(applyGreenColor)
  .pipeTap(log) // Execute function on the argument and return the argument
  .process(() => "What is the answer to life, the universe and everything?")
  .then(exit);
```

### SyncPipeline

```typescript
import { SyncPipeline } from "@raini/pipes";

const isOdd = (num: number) => num % 2 == 0;
const negate = <T>(f: (x: T) => any) => (x: T) => !f(x);
const filterOutOddNumbers = (nums: number[]) => nums.filter(negate(isOdd));
const multiplyBy2 = (num: number) => num * 2;
const multiplyItemsBy2 = (nums: number[]) => nums.map(multiplyBy2);
const log = console.log;

const result = SyncPipeline.of(filterOutOddNumbers)
  .pipeTap(log) // [ 1, 3, 5 ]
  .pipe(multiplyItemsBy2)
  .process(() => [1, 2, 3, 4, 5]);

log(result); // [ 2, 6, 10 ]

// A fun thing using pipeExtend (instead of pipe) for multiplying items by 2

const result2 = SyncPipeline.of(filterOutOddNumbers)
  .pipeTap(log) // [ 1, 3, 5 ]
  .pipeExtend(multiplyItemsBy2)
  .process(() => [1, 2, 3, 4, 5]);

log(result2); // [ 1, 3, 5, 2, 6, 10 ]
```
