import { Suspense } from 'react';
import { Bookmarks } from '@/components/Bookmarks';
import { Finder } from '@/components/Finder';
import { Footer, Header } from '@/components/Logo';
import { HeroRibbon } from '@/components/HeroRibbon';

const STEPS = [
  { tone: 'var(--kinari)', no: 'その1', ink: '#8a3a12', title: 'Describe it loosely', text: 'A character, a fight, a feeling. Half a sentence is enough.' },
  { tone: 'var(--asagi-tint)', no: 'その2', ink: 'var(--asagi)', title: 'We check every season', text: 'One ordered list across all seasons, so episode numbers never reset on you.' },
  { tone: 'var(--sakura)', no: 'その3', ink: '#a23a1b', title: 'Pick up where you were', text: 'Get the story so far for the last three episodes, and see what is a recap ahead.' },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div id="find" className="wrap hero">
          <div className="hero-top">
            <div className="hero-copy">
              <div className="tone" aria-hidden="true" />
              <p className="kicker note">どこまで見た？</p>
              <h1 className="display">
                Where did you
                <br />
                leave off?
              </h1>
              <p className="lede">Tell us the show and the scene you half remember. We’ll find the episode, and we’ll never show you anything past it.</p>
            </div>
            <HeroRibbon />
          </div>

          <Suspense fallback={<div className="panel panel-pop finder" style={{ minHeight: 360 }} />}>
            <Finder />
          </Suspense>
        </div>

        <Bookmarks />

        <section id="how" className="wrap section" aria-labelledby="how-title">
          <h2 id="how-title" className="display" style={{ marginBottom: 24 }}>
            How it works
          </h2>
          <div className="how">
            {STEPS.map((s) => (
              <div key={s.no} style={{ background: s.tone }}>
                <div className="note" style={{ fontSize: 16, color: s.ink }}>
                  {s.no}
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
