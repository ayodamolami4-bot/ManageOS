const {requestEmailChange,confirmEmailChange} = require("../services/emailChangeService");

async function request(req,res) {
  res.set("Cache-Control","no-store");
  try {
    const data = await requestEmailChange(
      req.user.id,req.user.company_id,req.body.newEmail,req.body.currentPassword
    );
    return res.status(202).json({
      data, message:"A confirmation link has been sent to your new email address."
    });
  } catch (error) {
    const status = {
      EMAIL_CHANGE_PASSWORD_INVALID:401, EMAIL_CHANGE_UNCHANGED:400,
      EMAIL_ALREADY_IN_USE:409, EMAIL_CHANGE_RETRY_LATER:429,
      EMAIL_CHANGE_UNAVAILABLE:503, EMAIL_CHANGE_DELIVERY_FAILED:503
    }[error.message];
    if (status) {
      const messages = {
        EMAIL_CHANGE_PASSWORD_INVALID:"Current password is incorrect.",
        EMAIL_CHANGE_UNCHANGED:"Enter a different email address.",
        EMAIL_ALREADY_IN_USE:"That email address is already registered.",
        EMAIL_CHANGE_RETRY_LATER:"Check your inbox or wait five minutes before trying again.",
        EMAIL_CHANGE_UNAVAILABLE:"Email verification is temporarily unavailable.",
        EMAIL_CHANGE_DELIVERY_FAILED:"Unable to send the verification email. Try again later."
      };
      return res.status(status).json({error:{code:error.message,message:messages[error.message]}});
    }
    console.error("Email change request failed:",error.message);
    return res.status(500).json({error:{code:"EMAIL_CHANGE_REQUEST_FAILED",message:"Unable to request an email change."}});
  }
}

async function confirm(req,res) {
  res.set("Cache-Control","no-store");
  try {
    await confirmEmailChange(req.body.token);
    // The session was removed server-side in the same transaction.
    res.clearCookie("session_id",{
      httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/"
    });
    return res.status(200).json({message:"Email updated. Sign in with your new email address."});
  } catch (error) {
    if (error.message==="EMAIL_CHANGE_TOKEN_INVALID")
      return res.status(400).json({error:{code:error.message,message:"This link is invalid, expired or already used."}});
    if (error.message==="EMAIL_ALREADY_IN_USE")
      return res.status(409).json({error:{code:error.message,message:"This address is already registered."}});
    console.error("Email change confirmation failed:",error.message);
    return res.status(500).json({error:{code:"EMAIL_CHANGE_CONFIRM_FAILED",message:"Unable to confirm email change."}});
  }
}

module.exports = { request, confirm };
