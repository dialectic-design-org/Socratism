import {useEffect, useRef, type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {useColorMode} from '@docusaurus/theme-common';
import type {ColorMode} from '@docusaurus/theme-common';

type FeatureLink = {
  href: string;
  label: string;
  media?: ReactNode;
};

const featureLinks: FeatureLink[] = [
  {
    href: '/works',
    label: 'Works',
    media: (
      <video
        className="feature-card__media"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true">
        <source
          src="https://hyperobjects.ams3.cdn.digitaloceanspaces.com/2025-10-15%20expanded%20vertical%20cube_cropped_2160_to_1080.mp4"
          type="video/mp4"
        />
      </video>
    ),
  },
  {
    href: '/concepts',
    label: 'Concepts',
    media: (
      <video
        className="feature-card__media"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true">
        <source
          src="https://hyperobjects.ams3.cdn.digitaloceanspaces.com/time-sphere-low-res-background.mp4"
          type="video/mp4"
        />
      </video>
    ),
  },
];

function ForceDarkMode(): null {
  const {colorMode, colorModeChoice, setColorMode: originalSetColorMode} = useColorMode();
  const savedChoice = useRef<ColorMode | null>(colorModeChoice);
  const isForcingDark = useRef(false);
  const componentId = useRef(Math.random().toString(36).substring(7));

  // Wrap setColorMode to log all calls
  const setColorMode = (mode: ColorMode | null) => {
    console.log(`[Homepage ${componentId.current}] setColorMode called with:`, mode);
    console.trace(`[Homepage ${componentId.current}] Stack trace for setColorMode call`);
    originalSetColorMode(mode);
  };

  console.log(`[Homepage ${componentId.current}] Render - Current state:`, {
    colorMode,
    colorModeChoice,
    savedChoice: savedChoice.current,
    isForcingDark: isForcingDark.current,
  });

  // Log when component mounts
  useEffect(() => {
    console.log(`[Homepage ${componentId.current}] COMPONENT MOUNTED`);
    return () => {
      console.log(`[Homepage ${componentId.current}] COMPONENT UNMOUNTED`);
    };
  }, []);

  // Capture the existing choice before forcing dark
  useEffect(() => {
    if (!isForcingDark.current) {
      console.log(`[Homepage ${componentId.current}] Saving choice:`, colorModeChoice);
      savedChoice.current = colorModeChoice;
    }
  }, [colorModeChoice]);

  // Force dark mode while on the homepage
  useEffect(() => {
    if (colorMode !== 'dark') {
      console.log(`[Homepage ${componentId.current}] Forcing dark mode, current mode:`, colorMode);
      console.trace(`[Homepage ${componentId.current}] Stack trace for forcing dark mode`);
      isForcingDark.current = true;
      setColorMode('dark');
    } else if (isForcingDark.current) {
      console.log(`[Homepage ${componentId.current}] Dark mode applied, clearing forcing flag`);
      isForcingDark.current = false;
    }
  }, [colorMode, setColorMode]);

  // Restore the visitor's saved choice on unmount
  useEffect(() => {
    console.log(`[Homepage ${componentId.current}] Cleanup effect registered`);
    return () => {
      console.log(`[Homepage ${componentId.current}] CLEANUP RUNNING - Unmounting, restoring choice:`, savedChoice.current);
      console.trace(`[Homepage ${componentId.current}] Stack trace for cleanup`);
      setColorMode(savedChoice.current);
      isForcingDark.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Home"
      description="Socratism Works index"
      wrapperClassName="homepage-wrapper">
      <ForceDarkMode />
      <main className="homepage">
        <section className="feature-grid">
          {featureLinks.map((item) => (
            <Link key={item.href} to={item.href} className="feature-card">
              {item.media}
              <span className="feature-card__label">{item.label}</span>
            </Link>
          ))}
        </section>
      </main>
    </Layout>
  );
}
