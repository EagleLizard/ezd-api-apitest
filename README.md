
# ezd-api-apitest

API / e2e / integration tests for `ezd-api`. Current version of `ezd-api` is `ezd-api-rc2`

## Getting Started

Some environment variables are expected for this to run. The preferred way to provide these is with a `.env` file:

```dotenv
EZD_API_BASE_URL=http://localhost:4446
```

## Test Runner

I might use Vitest, Mocha, or Node's test runner. Definitely _not Jest_. The default test runner provided by NodeJS still has a lot of features in "experimental" status.

Preferring `vitest` for now over the NodeJS test runner.

Support for running the tests with the NodeJS test runner is an issue because there's not great support for Typescript. To use Typescript with the NodeJS test runner, you need to do one of the following:

1. Compile the tests to JavaScript and run those
    1. This does not work well in practice because the compiler `tsc` doesn't _have a configuration option clean the output directory_ and doesn't keep track of what it just compiled well, even with flags like `--build`. This is an issue using conventional (and recommended) way of collecting test files: globbing, e.g. `fs.globSync('./**/*.test.js')`
    1. If the NodeJS runner had better compatibility, or if Typescript had better compilation options for tests, *__this would be the preferred method__*.
1. Run the node test runner with a 3rd party Typescript loader library like `ts-node` / `tsx`.
    1. This defeats the point of using the "standard" solution; I am already using at least one 3rd party library, Typescript. If I must rely on yet another library to run these tests, I may as well depend on something more fully-featured like `vitest`.
    1. IMHO this is a pretty glaring compatibility issue with both NodeJS and Typescript; While I am inclined to give NodeJS some slack for their test runner feature being so new, the fact that _NodeJS went so long without a standard test runner_ is an issue by itself. Typescript has had feature requests / issues open for almost a decade for `clean`.
    1. references:
        1. [official NodeJS docs](https://github.com/nodejs/nodejs.org/blob/ef0aa814a481748efbd9aba882f1e7b7dd519d0e/apps/site/pages/en/learn/typescript/run.md)
        1. [Related github issue `nodejs#3908` from 6/20/2022](https://github.com/nodejs/help/issues/3902)
        1. [Related github issue `typescript#16057`, "Typescript Watch - Cleaning Target Files on Source Deletion"](https://github.com/microsoft/TypeScript/issues/16057)
