export function invitationFeedback(response) {
  if (response?.data?.token) {
    return "Invitation created. Share the following development-only link securely:";
  }
  return "Invitation email sent. The recipient can join using the link in their inbox.";
}
