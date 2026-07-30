# Admin status updates

Submission status changes are authorized by the `/api/manage-admin` Vercel
function. They intentionally do not write directly from the browser, because
approving a listing can copy it to a public Firebase path.

If the dashboard reports that the update service is unavailable or missing
Firebase configuration, add these Production environment variables in Vercel
and redeploy:

| Variable | Value |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | The complete Firebase service-account JSON, pasted as valid JSON. |
| `FIREBASE_DATABASE_URL` | The exact Realtime Database URL (the same value as `VITE_FIREBASE_DATABASE_URL`). |

The service account needs access to the project's Realtime Database. Do not
expose the service-account JSON through a `VITE_` variable.
