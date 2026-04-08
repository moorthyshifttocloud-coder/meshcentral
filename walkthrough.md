# GitHub Login Fixes

This walkthrough outlines the exact changes made to `webserver.js` to ensure the MeshCentral dashboard correctly displays GitHub usernames and to force a prompt upon GitHub re-login. These are the same changes that were just applied to your system.

## 1. Forcing the GitHub Consent Prompt

To prevent GitHub from automatically passing the login flow without showing the user which account is being used, we updated the passport authentication call to request a `consent` prompt.

**File:** `webserver.js` (around line 7432)

```diff
- domain.passport.authenticate('github-' + domain.id, { scope: ['user:email'] })(req, res, next);
+ domain.passport.authenticate('github-' + domain.id, { scope: ['user:email'], prompt: 'consent' })(req, res, next);
```

> [!NOTE]
> GitHub OAuth doesn't have an exact `select_account` parameter, but passing `prompt: 'consent'` forces the authorization screen where the user must review the request. This provides a clear visualization of the currently active logged-in GitHub account and gives them an opportunity to switch or sign out of different accounts if desired.

## 2. Fixing the Missing Username in Dashboard

Many GitHub users do not set a public "DisplayName" on their profiles. When they log into MeshCentral, it resulted in a blank username. We fixed this by falling back to the standard GitHub `username` (the login handle) when `displayName` is missing.

**File:** `webserver.js` (around line 8104)

```diff
- var user = { sid: '~github:' + profile.id, name: profile.displayName, strategy: 'github' };
+ var user = { sid: '~github:' + profile.id, name: profile.displayName || profile.username, strategy: 'github' };
```

> [!TIP]
> The `|| profile.username` acts as a fallback. If the first value is blank, Node will automatically read the second value instead.

You can keep this document for future reference if you ever need to set up a new MeshCentral server or if you update `webserver.js` and need to re-apply the changes.
