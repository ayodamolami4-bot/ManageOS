# ManageOS Gmail sender without a Google Cloud billing prepayment

**Status:** This is an opt-in, low-volume provider. Nothing sends until a
ManageOS-owned Google Apps Script web app is personally authorized, deployed
and configured in Render. The existing Gmail API and Resend integrations
remain unchanged and can be selected later.

Google Cloud's trial signup may request a refundable **$30 prepayment** for
some payment methods/regions. You do **not** need that trial to create a
standalone Google Apps Script and use its built-in MailApp service.

## 1. Choose your sender

Sign into https://script.google.com/ with the Gmail account from which you
want ManageOS invitations and password resets to be sent. You can use an
existing Gmail address or a separate ManageOS-only Gmail account. Never
share the Gmail password, OAuth codes, or a shared secret in chat or GitHub.

Create a **New project** named **ManageOS Mailer**. In the project editor,
replace the initial Code.gs content with the complete contents of:

`integrations/apps-script/ManageOSMailer.gs`

The script uses `MailApp.sendEmail`, which does not read your Gmail inbox.
It includes request validation, authentication, basic idempotency and
no GET method that sends mail.

## 2. Generate a strong shared secret OFFLINE

On your own Windows computer, open **PowerShell** and run:

```powershell
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$secret = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
# Keep the value private; use it in both places described below.
$secret
```

Do **not** share the generated value in a chat or put it in source code.

In Apps Script, click **Project Settings** (gear icon), scroll to
**Script Properties**, choose **Add script property**, and save:

- Property: `MANAGEOS_MAIL_SECRET`
- Value: the private secret generated above

Use the **identical value** in Render later as `APPS_SCRIPT_SHARED_SECRET`.

## 3. Authorize the sender without sending a test message

Back in Apps Script, select the `authorizeSender` function in the function
dropdown and click **Run**. Google should prompt you to grant the script
permission to send email from the signed-in account. Review the requested
permission; it should not ask to read or delete email. The function only
checks available daily recipient quota and sends nothing.

If Google displays an unverified app warning for **your own script**, review
the project identity and scopes carefully. Do not authorize an unfamiliar
project. If authorization cannot complete, do not proceed to deployment.

## 4. Deploy a web app

Choose **Deploy > New deployment > Web app**. Set:

- Execute as: **Me** (the Gmail account authorized above)
- Who has access: **Anyone** (the backend uses a separate strong shared secret)

Authorize the deployment if prompted, then copy the **Web app URL** ending
in `/exec`. It should begin with:

`https://script.google.com/macros/s/`

**Important:** Anyone can technically call that publicly reachable URL.
Only a POST with the private shared secret may send mail. Keep the secret
private, use HTTPS, and never grant external parties edit access to the script.
Using the web app outside the Google Cloud OAuth client onboarding does not
guarantee continuous service; Google may enforce sending quotas or access
checks. A personal Gmail account is an interim sender for small volumes.

If you update the script later, deploy a new **version** of the web app.

## 5. Configure Render privately

In Render > ManageOS web service > Environment, add or update:

```text
EMAIL_PROVIDER=apps_script
APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
APPS_SCRIPT_SHARED_SECRET=<the SAME strong secret stored in Apps Script properties>
PUBLIC_APP_URL=https://manageos.onrender.com
```

Paste secrets **directly into Render**, never a chat, repository, frontend
`VITE_` variable, logs or screenshot. Use the real URL copied from Apps
Script. Do not turn on this provider before the script is authorized and
deployed. Save the settings and deploy the updated backend only after its
GitHub PR has passed CI and been merged.

The existing database, Supabase storage, CSRF, session, and other Render
configuration must not be changed. The existing OAuth settings can remain
unset because this provider does not use them.

## 6. Verify actual delivery

1. Sign into ManageOS as an Owner (or an authorized Manager).
2. Invite a new test email address you control that is **not already**
   registered in this company.
3. Confirm receipt, company name, assigned role, department and the
   `https://manageos.onrender.com/invite?token=...` link.
4. Open the link and confirm ManageOS verifies the company and role **before**
   password creation. Then test acceptance once, reuse denial, and expiry
   according to the existing workflows.
5. Test a password reset to your account's registered address.
6. If delivery reports failure, do not claim an invite was sent. Check
   Apps Script **Executions** and Render logs for errors, without pasting
   private tokens, invitation links or secret values anywhere.

The production invitation controller revokes an undelivered invitation
when the mail provider fails and returns a 503 response. The email bridge
returns `{ "ok": false }` when its secret, input, quota or send fails.
The backend checks JSON `ok: true`; HTTP 200 by itself is **not** success.

**Google limits:** Personal Gmail Apps Script MailApp quota is currently
100 recipient addresses per day, subject to change or removal without
notice. Mail may be delayed, rejected or filtered by spam systems. This is
not a scalable or guaranteed transactional-mail provider.

## Official references

- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/content
- https://developers.google.com/apps-script/guides/properties
- https://developers.google.com/apps-script/reference/mail/mail-app
- https://developers.google.com/apps-script/guides/services/quotas
