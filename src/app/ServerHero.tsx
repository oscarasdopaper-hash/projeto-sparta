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
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <h1 className={styles.heroTitle}>{t.titleHero}</h1>
        <h2 className={styles.heroSubtitle}>{t.subtitleHero}</h2>

        {/* Letras A-Z */}
        <div className={styles.azNav}>
          <span className={styles.azLabel}>{t.browseLetter}</span>
          <div className={styles.azList}>
            {alphabet.map((letter) => (
              <Link 
                key={letter} 
                href={`/letra/${letter.toLowerCase()}`}
                className={styles.azLetter}
              >
                {letter}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
