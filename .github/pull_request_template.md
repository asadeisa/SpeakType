## Description

Please include a summary of the change, what problem it solves, and the motivation behind it.

Closes # (issue number)

## Type of Change

Please delete options that are not relevant:

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update (no code-logic changes)

## How Has This Been Tested?

Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce.

- [ ] Manual test: (explain steps)
- [ ] Automated tests (if applicable)

## Checklist

Before submitting your pull request, please verify the following:

- [ ] My code follows the code style and guidelines of this project.
- [ ] **UTF-8 preservation:** I have verified that any Arabic or multilingual text remains correctly encoded (no ANSI/escaped characters/mojibake).
- [ ] **Database changes:** If I modified the database schema, I have run Drizzle generate and migrations, and I did **NOT** use `drizzle push`.
- [ ] All new ID columns are randomly-generated UUIDs (except where required by BetterAuth).
- [ ] I have run `pnpm lint` and fixed any lint issues.
- [ ] I have run `pnpm typecheck` and verified there are no TypeScript errors.
- [ ] I have run `pnpm build` and verified the production build compiles successfully.
- [ ] I have commented my code, particularly in hard-to-understand areas.
- [ ] I have updated the documentation or `README.md` if necessary.
- [ ] My changes generate no new warnings or deprecations.
