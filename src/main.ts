
import fs from 'node:fs';
import test from 'node:test';

import { apitest_dir } from './constants';
import { tap } from 'node:test/reporters';

(async () => {
  await main();
})();

async function main() {
  setProcName();
  await runApiTests();
  console.log('ezd-api-apitest ~');
}

async function runApiTests() {
  console.log(`${apitest_dir}/**/*.js`);
  let testFiles = fs.globSync(`${__dirname}/test/**/*.js`);
  console.log(testFiles);
  test.run({
    files: testFiles,
  })
    .compose(tap)
    .pipe(process.stdout);
}

function setProcName() {
  process.title = 'ezd-api-apitest';
}
