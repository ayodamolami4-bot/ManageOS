import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import { post } from "../../services/api";
import { apiErrorMessage } from "../../utils/validation";
import "./AccountSettings.css";

export default function AccountSettings() {
  const { user } = useAuth();
  const [newEmail,setNewEmail] = useState("");
  const [currentPassword,setCurrentPassword] = useState("");
  const [status,setStatus] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setStatus("");setError("");
    const next = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next) || next.length>254) {
      setError("Enter a valid new email address.");return;
    }
    if (next===user?.email?.toLowerCase()) {
      setError("Enter a different email address.");return;
    }
    if (!currentPassword) {setError("Enter your current password.");return;}
    setBusy(true);
    try {
      await post("/users/me/email-change",{newEmail:next,currentPassword});
      setStatus("Check the inbox at your new address. Open the confirmation link within one hour. Your current email stays active until you confirm.");
      setCurrentPassword("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {setBusy(false);}
  }

  return (
    <main className="account-settings">
      <div className="account-settings-intro">
        <span>ACCOUNT SECURITY</span>
        <h1>Your sign-in email</h1>
        <p>Changing your email changes where you sign in and receive account recovery messages. Verify ownership before the address changes.</p>
      </div>
      <section className="account-settings-panel">
        <div className="account-settings-current">
          <span>Current email</span>
          <strong>{user?.email || "Unavailable"}</strong>
          <p>This address remains active until your new email is confirmed.</p>
        </div>
        <form onSubmit={submit} noValidate>
          <label htmlFor="account-new-email">New email address</label>
          <input id="account-new-email" type="email" maxLength={254} autoComplete="email"
            required value={newEmail} disabled={busy}
            onChange={e=>setNewEmail(e.target.value)} placeholder="you@company.com" />
          <label htmlFor="account-current-password">Confirm your current password</label>
          <input id="account-current-password" type="password" autoComplete="current-password"
            required value={currentPassword} disabled={busy}
            onChange={e=>setCurrentPassword(e.target.value)}/>
          {error && <p role="alert" className="account-settings-error">{error}</p>}
          {status && <p role="status" className="account-settings-success">{status}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Sending confirmation..." : "Send verification email"}
          </button>
        </form>
        <p className="account-settings-footnote">After confirmation, all current sessions are signed out. You will use the new address for your next sign-in, with the same password. We also notify your old address.</p>
      </section>
    </main>
  );
}
