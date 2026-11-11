# Starting a new session

Paste this at the start of a new conversation (attach the repository zip, or give the agent the GitHub repo):

> You are continuing development of **Wildwood**, a multiplayer three.js forest RPG
> (repo: github.com/yuvalsegevvv/wildwood). Before anything else, read `CLAUDE.md` in the repository root.
> Do **not** read the whole codebase, and do **not** read `docs/FILES.md` end to end: it is a grep index of
> every file's one-line description (~40,000 tokens if read whole). Search it — `grep -ni "<word>" docs/FILES.md`
> — and open only the files the task needs (use CLAUDE.md's "Where to change what" table and `grep -rn` over `src/`).
> After changes run `python3 build.py --check` and the smallest matching test from `tools/` (a bare
> `node tools/run-tests.js` picks the tests that cover your diff). Don't commit or push unless I ask.
>
> My task: ...
