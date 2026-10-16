import "./DemoTour.css";

// Instructional copy only: operational data always comes from the read-only API.
// This module has no access to auth state, cookies, or the private workspace.
import { TOUR_STEPS } from "./demoTourSteps";

export default function DemoTour({ index, counts, onBack, onNext, onExit }) {
  const step = TOUR_STEPS[index];
  if (!step) return null;
  const last = index === TOUR_STEPS.length - 1;
  return (
    <section className="demo-tour" aria-label="Guided ManageOS product tour" data-testid="demo-guided-tour">
      <div className="demo-tour-heading">
        <div className="demo-tour-label">
          <span className="demo-tour-dot" aria-hidden="true" />
          GUIDED PRODUCT TOUR <span>·</span> STOP {String(index + 1).padStart(2,"0")} / {String(TOUR_STEPS.length).padStart(2,"0")}
        </div>
        <button className="demo-tour-dismiss" type="button" onClick={onExit} aria-label="Exit guided tour">Explore freely ×</button>
      </div>
      <div className="demo-tour-progress" role="progressbar" aria-label="Guided tour progress"
        aria-valuemin={0} aria-valuemax={TOUR_STEPS.length} aria-valuenow={index + 1}>
        <span style={{ width: ((index + 1) / TOUR_STEPS.length * 100) + "%" }} />
      </div>
      <div className="demo-tour-content" aria-live="polite" aria-atomic="true">
        <div className="demo-tour-copy">
          <h2>{step.title}</h2>
          <p>{step.description}</p>
          <small>{step.prompt}</small>
        </div>
        <div className="demo-tour-right">
          <div className="demo-tour-evidence"><strong>{counts?.[step.collection] ?? "—"}</strong><span>{step.collectionLabel}</span><small>FICTIONAL RECORDS · LIVE DATABASE</small></div>
          <div className="demo-tour-actions">
            <button type="button" onClick={onBack} disabled={index === 0}>← Back</button>
            <button type="button" className="demo-tour-next" onClick={onNext}>
              {last ? "Finish tour ✓" : "Next stop →"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
