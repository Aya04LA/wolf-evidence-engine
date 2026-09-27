import type { Metadata } from "next";

import {
  wolfEvent,
  wolfTracks,
  wolfDataset,
  formatCount,
  wolfResources,
} from "./wolf-hub-data";

export const metadata: Metadata = {
  title: "Wolf Materials Lab | Participant hub",
  description:
    "Start the luxury automotive procurement challenge. Open the demo, download the synthetic dataset and choose a focused technical track.",
};

export default function Page() {
  return (
    <div className="wolf-hub" lang="en">
      <a className="hub-skip" href="#main-content">
        Skip to content
      </a>
      <header className="hub-header hub-shell">
        <a
          className="hub-wordmark"
          href="/"
          aria-label="Wolf Materials Lab home"
        >
          Wolf<span>Materials lab</span>
        </a>
        <p className="hub-label">
          Participant hub
          <br />
          {wolfEvent.location} · {wolfEvent.date}
        </p>
      </header>
      <nav className="hub-nav" aria-label="Participant hub sections">
        <div className="hub-shell">
          <a href="#start">Start here</a>
          <a href="#tracks">Choose a track</a>
          <a href="#resources">Resources</a>
          <a href="#schedule">On the day</a>
          <a href="#deliver">Your handoff</a>
        </div>
      </nav>
      <main id="main-content">
        <section
          className="hub-hero hub-shell"
          id="start"
          aria-labelledby="hub-title"
        >
          <div className="hub-hero-copy">
            <p className="hub-kicker">
              Wolf Day · purchasing challenge
            </p>
            <h1 id="hub-title">
              From scattered inputs
              <br />
              to <em>clear decisions.</em>
            </h1>
            <p className="hub-lead">
              Choose one problem. Build a working slice. Show the evidence
              behind your result.
            </p>
            <p className="hub-body">
              Start with the demo, download the kit, then pick a track below.
              Wolf is a fictional procurement scenario. Supplier and part names
              are real references; commercial values and relationships are synthetic.
            </p>
            <div className="hub-actions">
              <a className="hub-button hub-button-primary" href="/dashboard">
                Open the live demo <span aria-hidden="true">↗</span>
              </a>
              <a
                className="hub-button"
                href="/downloads/wolf-starter.zip"
                download
              >
                Download starter kit <span className="hub-file-type">ZIP</span>
              </a>
            </div>
            <p className="hub-small">
              Demo UI and data are a starting point. Model integrations and the
              track capabilities are yours to build.
            </p>
          </div>
          <aside className="hub-start-note" aria-label="Your first steps">
            <p className="hub-label">Your starting sequence</p>
            <ol className="hub-start-list">
              <li>
                <span>01</span>
                <div>
                  <a href="/resources/brief">Read the challenge</a>
                  <p>
                    Understand the decision a procurement team needs to make.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <a href="/resources/setup">Get the kit running</a>
                  <p>
                    Use the supplied data and extend the existing interface.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <a href="#tracks">Choose one slice</a>
                  <p>Agree the input, the output and how you will verify it.</p>
                </div>
              </li>
            </ol>
            <div className="hub-access-note">
              <p className="hub-label">Model access</p>
              <p>
                DeepSeek API is the baseline. Ask your facilitator for access
                and keep credentials in your local environment.
              </p>
            </div>
          </aside>
        </section>

        <section className="hub-data-band" aria-labelledby="dataset-title">
          <div className="hub-shell">
            <div className="hub-band-heading">
              <h2 className="hub-label" id="dataset-title">
                Your synthetic sandbox
              </h2>
              <a
                className="hub-text-link"
                href="/downloads/wolf-dataset.zip"
                download
              >
                Download dataset ZIP <span aria-hidden="true">↗</span>
              </a>
            </div>
            <dl className="hub-metrics">
              {[
                ["Transactions", wolfDataset.transactions],
                ["Geographic markets", wolfDataset.markets],
                ["Products", wolfDataset.products],
                ["Suppliers", wolfDataset.suppliers],
                ["Invoice fixtures", wolfDataset.invoices],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{formatCount(Number(value))}</dd>
                </div>
              ))}
            </dl>
            <p className="hub-small">
              European-country inputs plus wider demo geography. Late updates
              are synthetic exercises too. Source: {wolfDataset.source},
              generated {wolfDataset.generatedAsOf}.
            </p>
          </div>
        </section>

        <section
          className="hub-section hub-shell"
          id="tracks"
          aria-labelledby="tracks-title"
        >
          <div className="hub-section-heading">
            <div>
              <p className="hub-kicker">01 · Choose a track</p>
              <h2 id="tracks-title">
                One useful slice
                <br />
                is enough.
              </h2>
            </div>
            <p className="hub-body">
              These are recommended build directions. Pick the one you can make
              demonstrable, with a clear failure case and an honest explanation
              of what remains unfinished.
            </p>
          </div>
          <div className="hub-tracks">
            {wolfTracks.map((track) => (
              <article className="hub-track" key={track.number}>
                <div className="hub-track-index">
                  <span>{track.number}</span>
                  <p className="hub-label">{track.label}</p>
                </div>
                <div className="hub-track-main">
                  <h3>{track.title}</h3>
                  <p>{track.problem}</p>
                  <div className="hub-track-detail">
                    <div>
                      <h4 className="hub-label">Build</h4>
                      <p>{track.build}</p>
                    </div>
                    <div>
                      <h4 className="hub-label">Show your evidence</h4>
                      <p>{track.prove}</p>
                    </div>
                  </div>
                  <p className="hub-file-note">Start with: {track.files}</p>
                </div>
              </article>
            ))}
          </div>
          <aside className="hub-optional">
            <div>
              <p className="hub-label">Optional · H100 request</p>
              <h3>Benchmark document extraction.</h3>
            </div>
            <div>
              <p>
                Define a measurable extraction task using the synthetic invoice
                fixtures and compare with a baseline. The supplied invoices are
                JSON representations; document rendering or PDF fixtures require
                additional work.
              </p>
              <p>
                Ask a facilitator about H100 access. The discussed window is{" "}
                {wolfEvent.proposedComputeWindow}, subject to allocation.
                Compute access is not required for the recommended tracks.
              </p>
            </div>
          </aside>
        </section>

        <section
          className="hub-section hub-resources-band"
          id="resources"
          aria-labelledby="resources-title"
        >
          <div className="hub-shell">
            <div className="hub-section-heading">
              <div>
                <p className="hub-kicker">02 · Resources</p>
                <h2 id="resources-title">Everything to get moving.</h2>
              </div>
              <p className="hub-body">
                Use the full starter kit for the application and data together.
                Use the dataset download if you are building in your own stack.
              </p>
            </div>
            <div className="hub-resource-grid">
              {wolfResources.map((resource) => (
                <a
                  className="hub-resource"
                  key={resource.href}
                  href={resource.href}
                >
                  <span className="hub-label">{resource.number} · Guide</span>
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  <span className="hub-resource-action">
                    {resource.action}
                    <span aria-hidden="true">↗</span>
                  </span>
                </a>
              ))}
            </div>
            <div className="hub-download-row">
              <a
                className="hub-text-link"
                href="/downloads/wolf-starter.zip"
                download
              >
                Full starter kit · ZIP
              </a>
              <a
                className="hub-text-link"
                href="/downloads/wolf-dataset.zip"
                download
              >
                Synthetic dataset · ZIP
              </a>
              <a className="hub-text-link" href="/dashboard">
                Explore the demo
              </a>
            </div>
          </div>
        </section>

        <section
          className="hub-section hub-shell"
          id="schedule"
          aria-labelledby="schedule-title"
        >
          <div className="hub-section-heading">
            <div>
              <p className="hub-kicker">03 · On the day</p>
              <h2 id="schedule-title">Build, then talk it through.</h2>
            </div>
            <p className="hub-body">
              All times are local to {wolfEvent.location}. Room, desk and
              facilitator assignments are pending. Check your allocation with
              the event team.
            </p>
          </div>
          <div className="hub-schedule-wrap">
            <table className="hub-schedule">
              <caption>{wolfEvent.date} · Participant schedule</caption>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">What happens</th>
                  <th scope="col">Status / next step</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Start of the session</th>
                  <td>
                    <strong>
                      {wolfEvent.briefingMinutes}-minute facilitator briefing
                    </strong>
                    <p>Scenario, data, track selection and access.</p>
                  </td>
                  <td>
                    Follow your desk allocation.
                    <br />
                    Exact start and room pending.
                  </td>
                </tr>
                <tr>
                  <th scope="row">{wolfEvent.proposedComputeWindow}</th>
                  <td>
                    <strong>Optional H100 compute window</strong>
                    <p>For an agreed experiment or extraction benchmark.</p>
                  </td>
                  <td>
                    <span className="hub-status">Proposed window</span>
                    <br />
                    Request access from a facilitator.
                  </td>
                </tr>
                <tr>
                  <th scope="row">From {wolfEvent.firesideStart}</th>
                  <td>
                    <strong>Fireside chats</strong>
                    <p>
                      {wolfEvent.firesideMinutes}-minute one-to-one
                      conversations about your work, choices and evidence.
                    </p>
                  </td>
                  <td>
                    Bring your repository or demo link.
                    <br />
                    Individual slots pending.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="hub-section hub-handoff"
          id="deliver"
          aria-labelledby="deliver-title"
        >
          <div className="hub-shell hub-handoff-grid">
            <div>
              <p className="hub-kicker">04 · Your handoff</p>
              <h2 id="deliver-title">
                Make your work
                <br />
                easy to inspect.
              </h2>
              <p className="hub-lead">
                Bring a repository or demo link to your fireside chat.
              </p>
            </div>
            <div>
              <ol className="hub-deliver-list">
                <li>
                  <h3>A working path</h3>
                  <p>
                    Show the input, your output and the decision it helps
                    someone make. Keep the scope small enough to run.
                  </p>
                </li>
                <li>
                  <h3>A useful README</h3>
                  <p>
                    Explain setup, your chosen track, assumptions, model use and
                    what you implemented. State what is mocked or incomplete.
                  </p>
                </li>
                <li>
                  <h3>Evidence and a failure case</h3>
                  <p>
                    Include source records, a reproducible comparison and a case
                    your approach cannot resolve. Show how a person reviews the
                    result.
                  </p>
                </li>
              </ol>
              <p className="hub-handoff-note">
                A submission destination has not been confirmed. Keep your link
                ready and bring it to the facilitator.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="hub-footer">
        <div className="hub-shell">
          <p className="hub-label">
            Wolf Materials Lab · Synthetic learning scenario
          </p>
          <a href="#start">Back to start</a>
        </div>
      </footer>
    </div>
  );
}
