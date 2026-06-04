# Encore Deployment Flow

This repo deploys through Encore Cloud by pushing to the `encore` git remote.

The frontend deploys separately through Vercel, which is linked to the GitHub repo.

## What actually happens

1. You change code locally.
2. You verify it with tests and lint.
3. You commit the change.
4. You push to the Encore remote:

```bash
git push encore main
```

5. Encore Cloud receives the push and starts deploys for the linked app.
6. The app currently linked here is `ideal-stay-online-gh5i`.
7. Encore creates environment deploy records for both `staging` and `prod`.
8. You verify the deploy in the Encore Cloud dashboard.

## Frontend deployment

The frontend is deployed by Vercel from GitHub, not by the Encore remote.

The repo contains a Vercel project config in:

- [`.vercel/project.json`](../.vercel/project.json)
- [`vercel.json`](../vercel.json)

That means a GitHub push can trigger the frontend deployment pipeline through Vercel if the project is connected that way in the dashboard.

In practice:

- `git push encore main` triggers Encore Cloud backend deploys
- `git push origin main` updates GitHub
- Vercel can then deploy the frontend from the GitHub-connected repo

If the Vercel project is set to auto-deploy from the GitHub `main` branch, then yes, the frontend part works off GitHub commits.
That is separate from the Encore backend deploy path.

## What the remote means

This repo has a dedicated remote named `encore`:

```text
encore://ideal-stay-online-gh5i
```

That remote is the deploy trigger. It is not a normal GitHub remote.

When `main` is pushed to that remote, Encore Cloud starts the backend deployment pipeline for the linked app.

## What MCP is for

Encore MCP is useful for context and cloud inspection.

It helps with:

- understanding app services and endpoints
- inspecting deployment metadata
- checking infrastructure state
- querying the deployed app context

It is not the same thing as the deployment trigger in this repo.

The local MCP server can be started with:

```bash
encore mcp start --app ideal-stay-online-gh5i
```

That exposes a local SSE endpoint for MCP-aware tools.

## Current app

- App id: `ideal-stay-online-gh5i`
- Linked local remote: `encore://ideal-stay-online-gh5i`
- Staging environment: `staging`
- Production environment: `prod`
- Vercel project: `ideal-stay`

## Operational sequence used here

The clean release loop is:

1. `npm run lint`
2. `npm test`
3. `git commit -m "..."`
4. `git push origin main` if the frontend should deploy through Vercel
5. `git push encore main` to trigger Encore backend deploys
6. Check both Vercel and Encore Cloud deploy status
7. Run live smoke against the deployed frontend if the change touches the public flow

## Notes

- Pushing to `origin` updates GitHub.
- Pushing to `origin` can trigger Vercel if the project is GitHub-connected.
- Pushing to `encore` triggers Encore Cloud deploys.
- The local Encore CLI in this environment does not expose a working `encore deploy` subcommand.
- For this repo, the remote push path is the real deployment mechanism.

Author: (|/) Klaasvaakie
