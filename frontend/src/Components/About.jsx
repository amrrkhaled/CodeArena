import "../style/About.css";

const About = () => {
  return (
    <section className="about-page">
      <div className="about-hero">
        <span className="about-kicker">About CodeArena</span>
        <h1>Competitive programming, without the clutter.</h1>
        <p>
          CodeArena is designed for focused contests: smooth registration, clear problem
          statements, reliable submissions, and a dashboard that keeps organizers in control.
        </p>
      </div>

      <div className="about-grid">
        <article className="about-card">
          <h2>For contestants</h2>
          <p>
            Join with your team, move quickly through the problem set, submit in your preferred
            language, and track progress in real time.
          </p>
        </article>
        <article className="about-card">
          <h2>For organizers</h2>
          <p>
            Create contests, upload problems, monitor every submission, and manage team activity
            from a single admin workspace.
          </p>
        </article>
        <article className="about-card">
          <h2>For growth</h2>
          <p>
            Use CodeArena to practice problem solving, sharpen teamwork, and create a more
            polished contest experience for your community.
          </p>
        </article>
      </div>

      <div className="about-values">
        <div className="about-values-copy">
          <span className="about-kicker">Why it works</span>
          <h2>A cleaner rhythm from start to scoreboard.</h2>
          <p>
            The platform focuses on a few things done well: easy onboarding, readable interfaces,
            dependable contest timing, and a dashboard that feels operational instead of chaotic.
          </p>
        </div>
        <div className="about-checklist">
          <div className="check-item">
            <strong>Structured contests</strong>
            <span>Set timing, activate events, and manage problems with less friction.</span>
          </div>
          <div className="check-item">
            <strong>Transparent progress</strong>
            <span>Review submissions and rankings with a faster feedback loop.</span>
          </div>
          <div className="check-item">
            <strong>Better experience</strong>
            <span>Give teams a space that feels modern, focused, and easy to trust.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
