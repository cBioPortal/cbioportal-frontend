`oql-parser.pegjs` is a copy of the frontend's `src/shared/lib/oql/oql-parser.pegjs`;
`test/oql/grammar.test.ts` fails if the two differ.

It is the round-trip oracle: every OQL string the service emits must parse with it and map back
to the same DSL. After updating the grammar, regenerate the parser with `pnpm gen:oql-parser`.
