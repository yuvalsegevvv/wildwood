# Starting a new session

Paste this at the start of a new conversation (attach the repository zip, or give the agent the GitHub repo):

> You are continuing development of **Wildwood**, a multiplayer three.js forest RPG
> (repo: github.com/yuvalsegevvv/wildwood). Before anything else, read `CLAUDE.md` in the repository root,
> then `docs/FILES.md`. Do **not** read the whole codebase: open only the files the task needs (use the
> "Where to change what" table and grep). After changes run `python3 build.py --check` and the smallest
> matching test from `tools/`. Don't commit or push unless I ask.
>
> My task: ...
