# ManageOS — Product design and UI quality standard

This project must feel deliberately designed for *company operations*, not like a generic SaaS template. These rules apply to every public and private page and will later inform the portfolio project.

## Brand and visual identity
- Maintain ManageOS' green, copper, lime and restrained sky-blue palette. Copper denotes attention, lime progress, sky-blue communication.
- Use the three-square brand motif purposefully. Do not add purple/blue gradients, glassmorphism, excessive glow, random blobs, floating pill badges or decorative bento layouts.
- Design each page around its **operational purpose**, not a repeated cards-plus-hero recipe. Projects should emphasize ownership and milestones; Work should emphasize assignee, state and next action; People should emphasize permissions and membership.
- Use typography with a clear hierarchy, readable contrast, comfortable body sizes and deliberate white space. Small uppercase labels are metadata, not substitutes for readable body text.
- Prefer real application data and useful states to fictional metrics and decorative dashboard screenshots. No generic claims such as “revolutionize productivity” without substance.

## Product functionality
- Every interactive control must act, be deliberately disabled with an explanation, or be removed. Never ship an inert form, button, chart or fake action.
- Loading, empty, populated, failure, forbidden and expired-session states must be considered. Focus on the next user action.
- Frontend constraints improve the experience; backend validation, company scoping and authorization remain the security boundary.
- A role must see its own priorities and only allowed actions. Disabled or hidden controls alone are not access control.
- Account recovery, invites and notifications must work end-to-end, not just look complete.
- Destructive operations require confirmation and must respect outstanding assignments/reviews.

## Mobile, accessibility and performance
- Check 390px and 768px widths; avoid horizontal page overflow. Controls need visible focus, labels, inline errors, keyboard access and touch-friendly targets.
- Do not rely on color alone to convey status or rely only on hover for actions.
- Avoid layout shifts, heavyweight background effects, unnecessary stock photos and motion that interferes with work.
- Keep regression tests for the critical workflows, and inspect actual Chromium/browser screenshots before shipping.

## Quality gate
For each screen, ask: If the logo were removed, would the structure and language still unmistakably belong to an operations-management product? Can a real user complete their primary task with clear feedback? Are all states truthful and accessible?

Reference perspectives: Nielsen Norman Group, “Prompt to Design Interfaces” (2026), “The Custodial Era of UX” (2026); Nielsen Norman Group, “Good from Afar, But Far from Good” (2025); OWASP security guidance for recovery flows.
