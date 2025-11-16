import type {ReactElement} from 'react';
import Layout from '@theme/Layout';
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

export default function FeedPage(): ReactElement {
  return (
    <Layout
      title="Feed"
      description="Latest Hyperobjects works feed"
      wrapperClassName="feed-page-wrapper">
      <main className="feed-page">
        <div className="container feed-page__content">
          <section className="feed-page__grid">
            {works.map((work) => (
              <Link
                key={work.slug}
                to={work.slug}
                className="feed-card">
                <div className="feed-card__mediaWrapper">
                  {renderMedia(work)}
                  <div className="feed-card__overlay">
                    <div className="feed-card__overlayContent">
                      <h2 className="feed-card__title">{work.title}</h2>
                      {work.description ? (
                        <p className="feed-card__description">{work.description}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
}
