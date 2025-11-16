import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import ForceDarkMode from '@site/src/components/ForceDarkMode';

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
