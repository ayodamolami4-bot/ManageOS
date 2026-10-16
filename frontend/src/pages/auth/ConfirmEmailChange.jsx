import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { post } from "../../services/api";
import { apiErrorMessage } from "../../utils/validation";
import "./Register.css";

export default function ConfirmEmailChange() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const validToken = /^[a-f0-9]{64}$/i.test(token);
  const [status,setStatus] = useState("idle");
  const [error,setError] = useState("");

  async function confirm() {
    if(!validToken || status==="busy" || status==="success") return;
    setStatus("busy");setError("");
    try {
      await post("/auth/confirm-email-change",{token});
      setStatus("success");
    } catch(err) {setError(apiErrorMessage(err));setStatus("error");}
  }

  return <main className="register-page">
    <nav className="register-nav">
      <Link className="register-brand" to="/"><span className="register-brand-mark">M</span>ManageOS</Link>
      <Link className="register-back" to="/login">Sign in →</Link>
    </nav>
    <section className="register-main">
      <div className="register-intro">
        <span className="register-kicker">ACCOUNT SECURITY</span>
        <h1>Confirm your <em>new email.</em></h1>
        <p>Your sign-in address only changes after you approve it.</p>
      </div>
      <div className="register-panel" aria-live="polite">
        <div className="register-panel-header"><div><span className="register-panel-kicker">Verification</span>
          <h2>{status==="success"?"Email updated.":"Confirm email change"}</h2></div>
          <span className="register-panel-mark" aria-hidden="true">M</span>
        </div>
        {status==="success" ? <>
          <p>Your email address was changed. All previous sessions were signed out.</p>
          <p><Link to="/login">Sign in with your new email address →</Link></p>
        </> : validToken ? <>
          <p>Confirm this change only if you requested it. Your existing sessions will end immediately.</p>
          {error && <p role="alert" className="register-hint">{error}</p>}
          <button type="button" className="register-submit" disabled={status==="busy"} onClick={confirm}>
            {status==="busy"?"Confirming...":"Confirm email change"} <span aria-hidden="true">→</span>
          </button>
        </> : <>
          <p role="alert">This confirmation link is invalid. Request a fresh link from Account Settings.</p>
          <p><Link to="/login">Return to sign in →</Link></p>
        </>}
      </div>
    </section>
  </main>;
}
