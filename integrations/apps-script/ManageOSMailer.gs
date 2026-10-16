/**
 * ManageOS low-volume transactional email bridge (Google Apps Script V8).
 *
 * Deploy as Web App -> Execute as: Me -> Who has access: Anyone.
 * ONLY the ManageOS backend knows the strong shared secret, stored in:
 * Project settings -> Script properties -> MANAGEOS_MAIL_SECRET.
 *
 * Anyone can technically call the public endpoint, but no email is sent
 * without the secret. Do not log request bodies or share script edit access.
 * Do not hardcode credentials, URLs, or customer data in this file.
 */
function jsonReply_(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok === true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sha256Hex_(value) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (b) {
    return ("0" + ((b + 256) % 256).toString(16)).slice(-2);
  }).join("");
}

function pruneSentMarkers_(properties) {
  var all = properties.getProperties();
  var now = Date.now();
  var maxAge = 7 * 24 * 60 * 60 * 1000;
  Object.keys(all).forEach(function (key) {
    if (!/^SENT_[a-f0-9]{64}$/.test(key)) return;
    var when = Number(all[key]);
    if (!Number.isFinite(when) || now - when > maxAge) {
      properties.deleteProperty(key);
    }
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || typeof e.postData.contents !== "string" ||
        e.postData.contents.length > 22000) return jsonReply_(false);

    var data = JSON.parse(e.postData.contents);
    var properties = PropertiesService.getScriptProperties();
    var expected = properties.getProperty("MANAGEOS_MAIL_SECRET");
    if (!expected || !/^[A-Za-z0-9_-]{48,256}$/.test(expected) ||
        typeof data.secret !== "string" || data.secret !== expected) {
      return jsonReply_(false);
    }

    var emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (typeof data.to !== "string" || data.to.length > 254 ||
        !emailPattern.test(data.to) || /[\r\n]/.test(data.to) ||
        typeof data.subject !== "string" || !data.subject ||
        data.subject.length > 240 || /[\r\n]/.test(data.subject) ||
        typeof data.text !== "string" || !data.text ||
        data.text.length > 16000) {
      return jsonReply_(false);
    }

    var key = data.idempotencyKey || "";
    if (typeof key !== "string" ||
        (key && !/^[a-zA-Z0-9_.-]{1,160}$/.test(key))) {
      return jsonReply_(false);
    }

    // Keep duplicate checks and sends serialized across simultaneous calls.
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return jsonReply_(false);
    try {
      var marker = key ? "SENT_" + sha256Hex_(key) : null;
      if (marker && properties.getProperty(marker)) return jsonReply_(true);

      if (MailApp.getRemainingDailyQuota() < 1) return jsonReply_(false);
      MailApp.sendEmail({
        to: data.to,
        subject: data.subject,
        body: data.text,
        name: "ManageOS"
      });
      if (marker) properties.setProperty(marker, String(Date.now()));
      // Remove markers older than the seven-day invitation lifetime.
      pruneSentMarkers_(properties);
      return jsonReply_(true);
    } finally {
      lock.releaseLock();
    }
  } catch (_) {
    // Never log recipients, invitation URLs, request bodies or secrets.
    console.error("ManageOS mail delivery failed");
    return jsonReply_(false);
  }
}

// A GET must never send an email.
function doGet() {
  return jsonReply_(false);
}
