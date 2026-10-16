import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../services/api";
import DemoTour, { TOUR_STEPS } from "./DemoTour";
import "./DemoExplorer.css";

const sections = [
  ["overview", "Overview", "Company pulse"],
  ["goals", "Goals", "Strategy and outcomes"],
  ["projects", "Projects", "Connected delivery"],
  ["work", "Work", "Tasks and review"],
  ["team", "Organization", "People and units"],
  ["updates", "Updates", "Requests and discussion"],
  ["record", "Record", "Activity trail"],
  ["files", "Files", "Source documents"]
];
const empty = {
  goals: [], projects: [], goalLinks: [], milestones: [], units: [],
  people: [], tasks: [], taskHistory: [], reports: [], reviews: [],
  blockers: [], requests: [], discussions: [], comments: [], activity: [], files: []
};
function date(value) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not scheduled" : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function status(value) { return String(value || "—").replaceAll("_", " ").toLowerCase(); }
function Status({ value }) { return <span className={"demo-status demo-status-" + String(value || "").toLowerCase()}>{status(value)}</span>; }
function Stat({ number, label, note }) {
  return <div className="demo-stat"><strong>{number}</strong><span>{label}</span>{note && <small>{note}</small>}</div>;
}
function Empty({ message }) { return <p className="demo-empty">{message}</p>; }
function PageIntro({ eyebrow, title, children }) {
  return <header className="demo-section-intro"><span className="demo-overline">{eyebrow}</span><h2>{title}</h2><p>{children}</p></header>;
}
export default function DemoExplorer() {
  const [section, setSection] = useState("overview");
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [tourIndex, setTourIndex] = useState(null);
  useEffect(() => {
    let active = true;
    get("/demo/overview")
      .then(response => {
        if (!active) return;
        setData({ ...empty, ...response.data });
        setLoadError("");
      })
      .catch(error => { if (active) setLoadError(error.message || "Unable to load the demo."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  const visibleTasks = useMemo(() => data.tasks.filter(task =>
    (filter === "ALL" || task.status === filter) &&
    [task.title, task.description, task.project_name, task.assignee_first_name].some(value =>
      String(value || "").toLowerCase().includes(search.toLowerCase().trim())
    )
  ), [data.tasks, filter, search]);
  const project = data.projects.find(item => item.id === selectedProject) || data.projects[0];
  const task = data.tasks.find(item => item.id === selectedTask) || visibleTasks[0];
  const counts = {
    active: data.projects.filter(item => item.status === "ACTIVE").length,
    completed: data.tasks.filter(item => item.status === "COMPLETED").length,
    attention: data.tasks.filter(item => ["NEEDS_CHANGES", "SUBMITTED"].includes(item.status)).length,
    open: data.blockers.filter(item => item.status === "OPEN").length
  };
  function jump(to, id) {
    setSection(to);
    if (to === "projects" && id) setSelectedProject(id);
    if (to === "work" && id) { setSelectedTask(id); setFilter("ALL"); setSearch(""); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  // Guided tour changes only this React page state. It never enters /app,
  // authenticates a visitor, or sends write requests to the production API.
  function showTourStep(nextIndex) {
    if (nextIndex < 0 || nextIndex >= TOUR_STEPS.length) {
      setTourIndex(null);
      return;
    }
    const stop = TOUR_STEPS[nextIndex];
    let id;
    if (stop.section === "projects") {
      id = (data.projects.find(item => item.status === "ACTIVE" && data.goalLinks.some(link => link.project_id === item.id))
        || data.projects[0])?.id;
    }
    if (stop.section === "work") {
      id = (data.tasks.find(item => data.reviews.some(review => review.task_id === item.id))
        || data.tasks[0])?.id;
    }
    setTourIndex(nextIndex);
    jump(stop.section, id);
  }
  const linkedGoals = item => data.goalLinks.filter(link => link.project_id === item.id)
    .map(link => data.goals.find(goal => goal.id === link.goal_id)).filter(Boolean);
  const relatedTasks = item => data.tasks.filter(entry => entry.project_id === item.id);
  const currentSection = sections.find(entry => entry[0] === section);
  return (
    <div className="demo-explorer">
      <div className="demo-topline">
        <Link to="/" className="demo-logo"><span className="demo-logo-mark">M</span> ManageOS</Link>
        <span>PUBLIC PRODUCT DEMONSTRATION <span aria-hidden="true"> / </span> NO ACCOUNT REQUIRED</span>
        <Link to="/register" className="demo-top-action">Create a workspace ↗</Link>
      </div>
      <div className="demo-body">
        <aside className="demo-sidebar">
          <div className="demo-sidebar-heading"><span className="demo-overline">SELECTED COMPANY / 001</span><strong>Tidepath<br/>Logistics<span>.</span></strong><small>Lagos, Nigeria · Fictional company</small></div>
          <div className="demo-live-label"><span className="demo-light" /> Live sample data <span className="demo-readonly">VIEW ONLY</span></div>
          <nav className="demo-navigation" aria-label="Demo sections">
            {sections.map(([key, label], index) =>
              <button key={key} type="button" className={section === key ? "demo-nav-current" : ""}
                onClick={() => jump(key)} aria-current={section === key ? "page" : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span>{label}<b aria-hidden="true">↗</b>
              </button>
            )}
          </nav>
          <div className="demo-sidebar-foot">
            <strong>Explore safely.</strong>
            <p>This is a live, read-only view of fictional data. Company accounts, editing and administrative actions are not available here.</p>
            <Link to="/product">How ManageOS works <span aria-hidden="true">→</span></Link>
          </div>
        </aside>
        <main className="demo-main">
          <div className="demo-path"><span>WORKSPACE PREVIEW</span><span>/</span><strong>{currentSection?.[1]}</strong><span className="demo-current-mode">READ-ONLY</span></div>
          {!loading && !loadError && tourIndex !== null && (
            <DemoTour index={tourIndex} counts={Object.fromEntries(
              TOUR_STEPS.map(stop => [stop.collection, data[stop.collection]?.length || 0])
            )} onBack={() => showTourStep(tourIndex - 1)}
              onNext={() => showTourStep(tourIndex + 1)}
              onExit={() => setTourIndex(null)} />
          )}
          {!loading && !loadError && tourIndex === null && section !== "overview" && (
            <button className="demo-tour-reset" type="button" onClick={() => showTourStep(0)}>↗ Take the guided product tour</button>
          )}
          {loading ? <div role="status" className="demo-loading"><span className="demo-light"/>Connecting to sample workspace…</div>
            : loadError ? <div className="demo-load-error" role="alert">
                <h2>We couldn't load Tidepath right now.</h2><p>{loadError}</p>
                <button type="button" onClick={() => {setLoading(true);setRevision(n=>n+1);}}>Try again</button>
              </div>
            : <>
              {section === "overview" && <>
                <header className="demo-hero">
                  <span className="demo-overline">OPERATIONAL FIELD NOTES / 16 OCT 2026</span>
                  <h1>Work in motion.<br/><em>Every detail connected.</em></h1>
                  <p>Explore how a fictional Lagos delivery company uses ManageOS to link strategic goals to teams, projects, assignments and reviewed outcomes. These figures come directly from the live database.</p>
                  <button type="button" className="demo-hero-link" onClick={() => jump("projects")}>Explore company projects <span aria-hidden="true">↗</span></button>
                </header>
                {tourIndex === null && <section className="demo-tour-invite">
                  <div>
                    <span className="demo-overline">START HERE / APPROX. 3 MINUTES</span>
                    <h2>See how a company actually works.</h2>
                    <p>Follow eight connected stops, from strategic goals through task reviews to downloadable evidence. Explore real fictional records, without an account or the ability to edit company data.</p>
                  </div>
                  <button className="demo-tour-start" type="button" onClick={() => showTourStep(0)}>Start guided tour ↗</button>
                </section>}
                <div className="demo-stat-grid">
                  <Stat number={data.goals.length} label="Company goals" note="Aligned to delivery work"/>
                  <Stat number={counts.active} label="Active projects" note={data.projects.length + " total projects"}/>
                  <Stat number={data.tasks.length} label="Tracked tasks" note={counts.completed + " completed"}/>
                  <Stat number={data.people.length} label="Team members" note={data.units.length + " organizational units"}/>
                </div>
                <div className="demo-section-split">
                  <section><PageIntro eyebrow="01 / DIRECTION" title="What needs attention.">Work awaiting review and issues still blocking progress.</PageIntro>
                    <div className="demo-attention">
                      <button type="button" onClick={() => {setFilter("SUBMITTED");jump("work");}}><strong>{data.tasks.filter(t => t.status === "SUBMITTED").length}</strong><span>Submitted for review</span><span aria-hidden="true">↗</span></button>
                      <button type="button" onClick={() => {setFilter("NEEDS_CHANGES");jump("work");}}><strong>{data.tasks.filter(t => t.status === "NEEDS_CHANGES").length}</strong><span>Need changes</span><span aria-hidden="true">↗</span></button>
                      <button type="button" onClick={() => jump("updates")}><strong>{counts.open}</strong><span>Open blockers</span><span aria-hidden="true">↗</span></button>
                    </div>
                  </section>
                  <section><PageIntro eyebrow="02 / ACTIVE PORTFOLIO" title="Live project register.">Select any project to open its milestones, work and evidence.</PageIntro>
                    <div className="demo-mini-list">
                      {data.projects.slice(0, 4).map(item => <button type="button" key={item.id} onClick={() => jump("projects", item.id)}>
                        <span>{item.name}</span><Status value={item.status} /><b aria-hidden="true">↗</b></button>)}
                    </div>
                  </section>
                </div>
              </>}
              {section === "goals" && <>
                <PageIntro eyebrow="01 / STRATEGIC DIRECTION" title="Company goals.">These objectives are persisted in PostgreSQL and connected to real project records in the sample company.</PageIntro>
                <div className="demo-card-grid">{data.goals.map(goal => <article key={goal.id} className="demo-data-card">
                  <div className="demo-card-top"><Status value={goal.status}/><span>{goal.priority} PRIORITY</span></div>
                  <h3>{goal.title}</h3><p>{goal.description}</p>
                  <div className="demo-link-section"><span>LINKED PROJECTS</span>
                    {data.goalLinks.filter(link => link.goal_id === goal.id).map(link => {
                      const related = data.projects.find(p => p.id === link.project_id);
                      return related && <button key={related.id} type="button" onClick={() => jump("projects", related.id)}>{related.name} <b>↗</b></button>;
                    })}
                  </div><div className="demo-card-foot">Target: {date(goal.due_date)}</div>
                </article>)}</div>
              </>}
              {section === "projects" && <>
                <PageIntro eyebrow="02 / PORTFOLIO" title="Projects with purpose.">Choose a project to view its objectives, delivery milestones, assigned work and associated documents.</PageIntro>
                <div className="demo-explorer-columns">
                  <div className="demo-select-list" aria-label="Choose a project">{data.projects.map(item =>
                    <button type="button" key={item.id} aria-pressed={project?.id===item.id}
                      className={project?.id===item.id?"demo-selected":""} onClick={() => setSelectedProject(item.id)}>
                      <span>{item.name}</span><Status value={item.status}/><small>{relatedTasks(item).length} tasks</small>
                    </button>)}</div>
                  {project && <div className="demo-detail-panel">
                    <span className="demo-overline">PROJECT PROFILE / {project.priority} PRIORITY</span>
                    <h3>{project.name}</h3><Status value={project.status}/><p>{project.description}</p>
                    <div className="demo-detail-meta"><span>Start: {date(project.start_date)}</span><span>Target: {date(project.due_date)}</span></div>
                    <div className="demo-detail-group"><h4>Related company goals</h4>
                      {linkedGoals(project).length?linkedGoals(project).map(g=><span className="demo-pill" key={g.id}>{g.title}</span>):<Empty message="No linked goal"/>}</div>
                    <div className="demo-detail-group"><h4>Milestone schedule</h4>
                      {data.milestones.filter(m=>m.project_id===project.id).map(m=><div className="demo-row-entry" key={m.id}><strong>{m.name}</strong><Status value={m.status}/><small>{date(m.due_date)}</small></div>)}</div>
                    <div className="demo-detail-group"><h4>Project work</h4>
                      {relatedTasks(project).map(t=><button className="demo-row-entry demo-row-button" key={t.id} type="button" onClick={()=>jump("work",t.id)}><strong>{t.title}</strong><Status value={t.status}/><b aria-hidden="true">↗</b></button>)}</div>
                    <div className="demo-detail-group"><h4>Project evidence</h4>
                      {data.files.filter(f=>f.project_id===project.id).length ? data.files.filter(f=>f.project_id===project.id).map(f=><a className="demo-file-link" href={"/api/demo/files/"+f.id} key={f.id}>{f.original_name} <span>Download ↗</span></a>):<Empty message="No public demo documents for this project."/>}</div>
                  </div>}
                </div>
              </>}
              {section === "work" && <>
                <PageIntro eyebrow="03 / EXECUTION" title="Tasks, updates, decisions.">Filter live work, then inspect the status trail, assignee, progress notes and review outcomes.</PageIntro>
                <div className="demo-filters"><label>Search work <input aria-label="Search work" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search task, project, person…" /></label>
                  <label>Workflow state <select aria-label="Workflow state" value={filter} onChange={e=>setFilter(e.target.value)}>{["ALL","ASSIGNED","IN_PROGRESS","SUBMITTED","NEEDS_CHANGES","COMPLETED"].map(s=><option value={s} key={s}>{s==="ALL"?"All statuses":status(s)}</option>)}</select></label>
                  <span>{visibleTasks.length} matching tasks</span>
                </div>
                <div className="demo-explorer-columns">
                  <div className="demo-select-list">{visibleTasks.length?visibleTasks.map(item=><button type="button" key={item.id}
                    aria-pressed={task?.id===item.id} className={task?.id===item.id?"demo-selected":""} onClick={()=>setSelectedTask(item.id)}>
                    <span>{item.title}</span><Status value={item.status}/><small>{item.project_name}</small>
                  </button>):<Empty message="No tasks match this filter."/>}</div>
                  {task&&visibleTasks.length>0?<div className="demo-detail-panel"><span className="demo-overline">TASK RECORD / {task.priority} PRIORITY</span><h3>{task.title}</h3><Status value={task.status}/><p>{task.description}</p>
                    <div className="demo-detail-meta"><span>Assignee: {task.assignee_first_name ? task.assignee_first_name+" "+task.assignee_last_name:"Unassigned"}</span><span>Due: {date(task.due_date)}</span></div>
                    <button className="demo-context-link" type="button" onClick={()=>jump("projects",task.project_id)}>View parent project: {task.project_name} ↗</button>
                    <div className="demo-detail-group"><h4>Progress reports</h4>
                      {data.reports.filter(x=>x.task_id===task.id).map((r,i)=><div className="demo-row-entry" key={i}><strong>{r.progress_percentage}% reported progress</strong><p>{r.content}</p></div>)}
                      {!data.reports.some(x=>x.task_id===task.id)&&<Empty message="No progress reports yet."/>}
                    </div>
                    <div className="demo-detail-group"><h4>Review decisions</h4>{data.reviews.filter(x=>x.task_id===task.id).map((r,i)=><div className="demo-row-entry" key={i}><Status value={r.decision}/><p>{r.comment}</p><small>Reviewed by {r.reviewer_first_name}</small></div>)}
                      {!data.reviews.some(x=>x.task_id===task.id)&&<Empty message="No review decision yet."/>}</div>
                    <div className="demo-detail-group"><h4>Status history</h4>{data.taskHistory.filter(x=>x.task_id===task.id).map((h,i)=><div key={i} className="demo-history-row"><span>{status(h.new_status)}</span><small>{h.actor_first_name} · {date(h.created_at)}</small></div>)}</div>
                    {data.blockers.filter(x=>x.task_id===task.id).map((b,i)=><div className="demo-warning" key={i}><strong>{b.title}</strong><p>{b.description}</p><Status value={b.status}/></div>)}
                  </div>:<Empty message="Select a task to inspect its workflow."/>}
                </div>
              </>}
              {section === "team" && <>
                <PageIntro eyebrow="04 / COMPANY STRUCTURE" title="Work has an owner.">A fictional cross-functional Lagos team, with distinct role assignments and organization units.</PageIntro>
                <div className="demo-stat-grid"><Stat number={data.people.length} label="People"/><Stat number={data.units.length} label="Organization units"/><Stat number={data.people.filter(p=>p.role_name==="EMPLOYEE").length} label="Contributors"/><Stat number={data.people.filter(p=>p.role_name==="TEAM_LEAD").length} label="Team leads"/></div>
                <h3 className="demo-subtitle">The operating structure</h3>
                <div className="demo-card-grid">{data.units.map(unit=><article className="demo-data-card" key={unit.id}><span className="demo-overline">{unit.type}</span><h3>{unit.name}</h3><p>{unit.description}</p><small>{data.units.find(u=>u.id===unit.parent_unit_id)?"Within "+data.units.find(u=>u.id===unit.parent_unit_id).name:"Company department"}</small></article>)}</div>
                <h3 className="demo-subtitle">Company directory</h3>
                <div className="demo-people-grid">{data.people.map(p=><article key={p.id} className="demo-person"><div className="demo-avatar">{p.first_name[0]}{p.last_name[0]}</div><div><strong>{p.first_name} {p.last_name}</strong><span>{p.job_title}</span><small>{status(p.role_name)}{p.unit_name?" · "+p.unit_name:" · Company-wide"}</small></div></article>)}</div>
              </>}
              {section === "updates" && <>
                <PageIntro eyebrow="05 / COORDINATION" title="Decisions and conversations.">Operational requests, blockers and discussions, attached to real company work.</PageIntro>
                <h3 className="demo-subtitle">Requests requiring a response</h3>
                <div className="demo-card-grid">{data.requests.map(r=><article className="demo-data-card" key={r.id}><div className="demo-card-top"><Status value={r.status}/><span>{r.type}</span></div><h3>{r.title}</h3><p>{r.description}</p><div className="demo-card-foot">Raised by {r.requested_by_first_name}</div></article>)}</div>
                <h3 className="demo-subtitle">Delivery blockers</h3>
                <div className="demo-card-grid">{data.blockers.map((b,i)=><article className="demo-data-card" key={i}><div className="demo-card-top"><Status value={b.status}/></div><h3>{b.title}</h3><p>{b.description}</p><button className="demo-text-link" type="button" onClick={()=>jump("work",b.task_id)}>Open linked task ↗</button></article>)}</div>
                <h3 className="demo-subtitle">Discussions and replies</h3>
                <div className="demo-discussions">{data.discussions.map(d=><article key={d.id}><span className="demo-overline">{d.project_name}</span><h3>{d.title}</h3>
                  {data.comments.filter(c=>c.discussion_id===d.id).map((c,i)=><p key={i}><strong>{c.author_first_name}</strong> {c.content}</p>)}</article>)}</div>
              </>}
              {section === "record" && <>
                <PageIntro eyebrow="06 / ACTIVITY HISTORY" title="A record of what changed.">A sample timeline drawn from the same company-scoped activity records as the authenticated application. Internal audit payloads remain private.</PageIntro>
                <div className="demo-timeline">{data.activity.map((entry,i)=><div className="demo-event" key={i}><span className="demo-event-time">{date(entry.created_at)}</span><div><strong>{status(entry.action)}</strong><p>{entry.actor_first_name} · {status(entry.resource_type)}</p></div></div>)}</div>
              </>}
              {section === "files" && <>
                <PageIntro eyebrow="07 / SOURCE DOCUMENTS" title="Evidence, not decoration.">These three fictional pilot notes are real files stored privately in Supabase, with allowlisted read-only downloads from this demo.</PageIntro>
                <div className="demo-documents">{data.files.length?data.files.map(f=><article key={f.id} className="demo-document"><div><span className="demo-overline">TEXT DOCUMENT / SAMPLE ONLY</span><h3>{f.original_name}</h3><p>{f.project_name} · {Math.ceil(Number(f.size_bytes)/1024)} KB</p></div><a href={"/api/demo/files/"+f.id} download={f.original_name}>Download sample ↗</a></article>):<Empty message="The sample documents are temporarily unavailable."/>}</div>
              </>}
              <footer className="demo-content-footer"><span>FICTIONAL COMPANY · REAL APPLICATION DATA · READ-ONLY TOUR</span><Link to="/">Back to ManageOS ↗</Link></footer>
            </>}
        </main>
      </div>
    </div>
  );
}
