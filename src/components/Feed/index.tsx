import {useEffect, useRef, useState} from 'react';
import type {CSSProperties, ReactElement, RefObject} from 'react';
import Link from '@docusaurus/Link';
import works from '@site/computed/works-index.json';

type Work = (typeof works)[number];

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

const INTERSECTION_OPTIONS: IntersectionObserverInit = {
  rootMargin: '200px 0px',
  threshold: 0,
};

const getPreferredSource = (work: Work): string | undefined =>
  work.previewSource || work.staticPreviewSource || work.fileSource;

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

const renderMedia = (work: Work): ReactElement => {
  const source = getPreferredSource(work);
  const kind = inferMediaKind(source);

  if (kind === 'video' && source) {
    return (
      <video autoPlay loop muted playsInline preload="metadata" aria-hidden="true">
        <source src={source} />
      </video>
    );
  }

  if (kind === 'image' && source) {
    return <img src={source} alt={work.title} loading="lazy" decoding="async" />;
  }

  return (
    <div className="feed__mediaFallback" aria-hidden="true">
      Media unavailable
    </div>
  );
};

const getDisplayDate = (work: Work): string | undefined => work.issued || work.created;

const getLatestWorks = (): Work[] => {
  const byIssuedDesc = [...works].sort((a, b) => {
    const aTime = Date.parse(a.issued ?? a.created ?? '') || 0;
    const bTime = Date.parse(b.issued ?? b.created ?? '') || 0;
    return bTime - aTime;
  });

  return byIssuedDesc.slice(0, 10);
};

const useInViewport = (): {ref: RefObject<HTMLElement>; isVisible: boolean} => {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    if (!ref.current) {
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    }, INTERSECTION_OPTIONS);

    const current = ref.current;
    observer.observe(current);

    return () => {
      observer.unobserve(current);
      observer.disconnect();
    };
  }, [isVisible]);

  return {ref, isVisible};
};

type FeedItemProps = {
  work: Work;
};

const getMediaAspectStyle = (work: Work): CSSProperties | undefined => {
  const width = (work as {mediaWidth?: number}).mediaWidth;
  const height = (work as {mediaHeight?: number}).mediaHeight;
  if (width && height) {
    return {
      '--feed-media-width': `${width}`,
      '--feed-media-height': `${height}`,
    } as CSSProperties;
  }
  return undefined;
};

const FeedItem = ({work}: FeedItemProps): ReactElement => {
  const {ref, isVisible} = useInViewport();
  const displayDate = getDisplayDate(work);
  const mediaStyle = getMediaAspectStyle(work);

  return (
    <article ref={ref} className="feed__item">
      {isVisible ? (
        <Link to={work.slug} className="feed__link">
          <div className="feed__media" style={mediaStyle}>
            {renderMedia(work)}
          </div>
          <div className="feed__body">
            <h3>{work.title}</h3>
            {displayDate ? (
              <time className="feed__date" dateTime={displayDate} title={displayDate}>
                {displayDate}
              </time>
            ) : null}
          </div>
        </Link>
      ) : (
        <div className="feed__placeholder" aria-hidden="true">
          <div className="feed__media feed__media--placeholder" style={mediaStyle} />
          <div className="feed__body">
            <span className="feed__titlePlaceholder" />
            <span className="feed__datePlaceholder" />
          </div>
        </div>
      )}
    </article>
  );
};

export default function Feed(): ReactElement {
  const latestWorks = getLatestWorks();

  return (
    <section className="feed">
      <div className="feed__items">
        {latestWorks.map((work) => (
          <FeedItem key={work.slug} work={work} />
        ))}
      </div>
    </section>
  );
}
