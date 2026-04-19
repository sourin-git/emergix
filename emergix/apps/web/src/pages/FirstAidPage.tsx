import { getFirstAidGuides } from "@emergix/services";

export function FirstAidPage() {
  const guides = getFirstAidGuides();

  return (
    <section className="card-grid">
      <article className="panel stitch-panel">
        <p className="eyebrow">OFFLINE RESILIENCE KIT</p>
        <h1>Offline First-Aid Directory</h1>
        <p>Loaded from local storage cache to support low-connectivity scenarios.</p>
        <div className="guide-list">
          {guides.map((guide) => (
            <article className="guide-card" key={guide.id}>
              <p className="guide-category">{guide.category}</p>
              <h2>{guide.title}</h2>
              <ol>
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
