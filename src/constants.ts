import path from 'node:path';

export const base_dir = path.resolve(__dirname, '..');

export const apitest_dir = [ base_dir, 'src', 'test' ].join(path.sep);
