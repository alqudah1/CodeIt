# Parent progress notifications

## Current release status

The feature code exists in the private feature worktree, but the currently
running AWS backend does not expose these routes and SMTP delivery is not
configured. Treat the experience as pre-launch until the backend is deployed,
the sending domain is verified, and controlled confirmation and milestone
emails pass end-to-end testing.

## What is implemented

- Records first-time student milestones for:
  - lesson completion;
  - individual coding exercise completion;
  - puzzle and quiz completion;
  - project or website creation;
  - project publishing.
- Adds a student Profile section for the parent email, notification choices,
  verification status, milestone counts, and recent activity.
- Requires the parent or guardian to confirm their email before any student
  progress is sent.
- Adds an unsubscribe link to every progress email.
- Prevents duplicate milestone emails when a student repeats an activity.
- Records delivery status for support and troubleshooting.

## Email delivery configuration

The application supports a standard authenticated SMTP provider. AWS SES SMTP is
recommended because CodeIt is already hosted on AWS.

Required environment variables:

```text
PUBLIC_SITE_URL=https://codeitlearn.com
EMAIL_FROM=CodeIt Progress <progress@codeitlearn.com>
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
```

Before production deployment:

1. Verify `codeitlearn.com` as a sending domain in AWS SES.
2. Add the SES-provided DNS records.
3. Move the SES account out of sandbox mode or verify every recipient used for
   the pilot.
4. Create restricted SES SMTP credentials.
5. Add the variables to the backend `.env` without committing secrets.
6. Send one confirmation email and one milestone email to a controlled test
   parent account.

## The weekly and monthly emails send themselves

`vercel.json` schedules two cron jobs: `/api/cron/weekly-digest` every Sunday
at 18:00 UTC and `/api/cron/monthly-digest` on the 28th at 16:00 UTC (on the
Hobby plan Vercel may run them at any point in that hour). Both are no-ops
without a `CRON_SECRET` environment variable of at least 16 characters on the
Vercel project: Vercel sends it as `Authorization: Bearer <CRON_SECRET>` and
the route refuses anything else. Set it in the project's Environment Variables
and redeploy. The admin dashboard's send buttons still work for a manual run,
and a send is logged per family per period, so a manual run and the cron
never send the same email twice. `?dry=1` on either path counts without
sending.

## Privacy behaviour

- A student cannot activate updates merely by entering somebody's email.
- Progress emails remain off until the recipient confirms.
- The recipient can stop emails without signing into CodeIt.
- Email bodies contain milestone summaries, not student code or private project
  contents.
