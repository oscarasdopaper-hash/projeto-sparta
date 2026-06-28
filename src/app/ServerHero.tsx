import React from 'react';
import Link from 'next/link';
import styles from './layout.module.css';

export default function ServerHero({ 
  t, 
  alphabet 
}: { 
  t: any, 
  alphabet: string[] 
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .heroSection {
          background: radial-gradient(circle at top right, color-mix(in srgb, var(--tenant-primary) 15%, transparent) 0%, color-mix(in srgb, var(--tenant-primary) 2%, transparent) 50%, #ffffff 100%);
          border-bottom: 1px solid var(--border-color);
          padding: 80px 0 60px 0;
        }
        .heroContainer {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          text-align: center;
        }
        .heroTitle {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
          color: var(--text-main);
        }
        .heroSubtitle {
          font-size: 18px;
          color: var(--text-muted);
          max-width: 650px;
          margin: 0 auto 40px auto;
          line-height: 1.6;
        }
        .azNav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background-color: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 20px 24px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          max-width: 900px;
          margin: 0 auto;
        }
        .azLabel {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        .azList {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .azLetter {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
          border-radius: var(--radius-sm);
          border: 1px solid transparent;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .azLetter:hover {
          background-color: color-mix(in srgb, var(--tenant-primary) 10%, transparent);
          color: var(--tenant-primary);
          border-color: color-mix(in srgb, var(--tenant-primary) 20%, transparent);
          transform: scale(1.1);
        }
        @media (max-width: 768px) {
          .heroTitle { font-size: 36px; padding: 0 10px; }
          .heroSection { padding: 40px 0 30px 0; }
        }
      `}} />
      <section className="heroSection">
        <div className="heroContainer">
          <h1 className="heroTitle">{t.titleHero}</h1>
          <h2 className="heroSubtitle">{t.subtitleHero}</h2>

          {/* Letras A-Z */}
          <div className="azNav">
            <span className="azLabel">{t.browseLetter}</span>
            <div className="azList">
              {alphabet.map((letter) => (
                <Link 
                  key={letter} 
                  href={`/letra/${letter.toLowerCase()}`}
                  className="azLetter"
                >
                  {letter}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
