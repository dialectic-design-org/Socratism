import {useEffect, useRef, useState, type CSSProperties, type ReactElement, type RefObject} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import ForceDarkMode from '@site/src/components/ForceDarkMode';
import works from '@site/computed/works-index.json';

type Work = (typeof works)[number];


const getLatestWorks = (): Work[] => {
  const byIssuedDesc = [...works].sort((a, b) => {
    const aTime = Date.parse(a.issued ?? a.created ?? '') || 0;
    const bTime = Date.parse(b.issued ?? b.created ?? '') || 0;
    return bTime - aTime;
  });

  return byIssuedDesc.slice(0, 100);
};

const VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.webm', '.ogg', '.ogv', '.mov', '.avi'];
const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
  '.svg',
  '.bmp',
  '.tiff',
];

const inferMediaKind = (source?: string): 'video' | 'image' | 'unknown' => {
  if (!source) {
    return 'unknown';
  }

  const cleanSource = source.split('?')[0]?.toLowerCase() ?? '';

  if (VIDEO_EXTENSIONS.some((ext) => cleanSource.endsWith(ext))) {
    return 'video';
  }

  if (IMAGE_EXTENSIONS.some((ext) => cleanSource.endsWith(ext))) {
    return 'image';
  }

  return 'unknown';
};

const getPreferredSource = (work: Work): string | undefined =>
  work.previewSource || work.staticPreviewSource || work.fileSource;

const renderMedia = (work: Work): ReactElement => {
  const source = getPreferredSource(work);
  const kind = inferMediaKind(source);

  if (kind === 'video' && source) {
    return (
      <video
        className="feed-card__media"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true">
        <source src={source} />
      </video>
    );
  }

  if (kind === 'image' && source) {
    return (
      <img
        className="feed-card__media"
        src={source}
        alt={work.title}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="feed-card__media feed-card__media--fallback">
      Media unavailable
    </div>
  );
};

const thresholds = Array.from({length: 21}, (_, idx) => idx / 20);

const useScrollProgress = (): {ref: RefObject<HTMLDivElement>; progress: number} => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setProgress(1);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setProgress(entry.intersectionRatio);
      },
      {rootMargin: '-15% 0px -15% 0px', threshold: thresholds},
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
      observer.disconnect();
    };
  }, []);

  return {ref, progress};
};

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

const getOverlayOpacity = (ratio: number): number => {
  // Start fading when 20% of the media is visible and finish when ~85% is visible
  const start = 0.2;
  const end = 0.5;
  if (ratio <= start) {
    return 0;
  }
  if (ratio >= end) {
    return 1;
  }
  return clamp((ratio - start) / (end - start));
};

type FeedCardProps = {
  work: Work;
};

const FeedCard = ({work}: FeedCardProps): ReactElement => {
  const {ref, progress} = useScrollProgress();
  const overlayOpacity = getOverlayOpacity(progress);
  const overlayStyle = {
    '--feed-card-overlay-opacity': overlayOpacity,
  } as CSSProperties;

  return (
    <Link to={work.slug} className="feed-card">
      <div className="feed-card__mediaWrapper" ref={ref}>
        {renderMedia(work)}
        <div className="feed-card__overlay" style={overlayStyle}>
          <div className="feed-card__overlayContent">
            <h2 className="feed-card__title">{work.title}</h2>
            {work.description ? <p className="feed-card__description">{work.description}</p> : null}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function FeedPage(): ReactElement {
  const latestWorks = getLatestWorks();
  return (
    <Layout
      title="Feed"
      description="Latest Hyperobjects works feed"
      wrapperClassName="feed-page-wrapper">
      <ForceDarkMode />
      <main className="feed-page">
        <div className="container feed-page__content">
          <section className="feed-page__grid">
            {latestWorks.map((work) => (
              <FeedCard key={work.slug} work={work} />
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
}
