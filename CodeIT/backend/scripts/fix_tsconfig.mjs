import fs from 'fs';
import path from 'path';

const dirs = [
  'call-bind-apply-helpers',
  'call-bound',
  'dunder-proto',
  'es-define-property',
  'es-errors',
  'es-object-atoms',
  'es-set-tostringtag',
  'get-proto',
  'gopd',
  'has-symbols',
  'has-tostringtag',
  'hasown',
  'math-intrinsics'
];

const validConfig = JSON.stringify(
  {
    compilerOptions: {
      target: 'es2021'
    },
    exclude: ['coverage']
  },
  null,
  2
);

let count = 0;
for (const dir of dirs) {
  const p = path.join('d:/UDAY/Projects/CodeIT/CodeIT/backend/node_modules', dir, 'tsconfig.json');
  if (fs.existsSync(p)) {
    fs.writeFileSync(p, validConfig);
    console.log('Fixed tsconfig in:', dir);
    count++;
  }
}
console.log(`Total fixed: ${count}`);
