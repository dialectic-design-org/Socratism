import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import styles from './styles.module.css';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.m4v'];

function useSyntheticTitle(): string | null {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

function normalizeExtension(src: string): string {
  const withoutQuery = src.split('?')[0];
  return withoutQuery.toLowerCase();
}

function isVideoSource(src: string): boolean {
  const normalized = normalizeExtension(src);
  return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function FileSourcePreview({source}: {source: string}) {
  if (isVideoSource(source)) {
    return (
      <div className={clsx('margin-bottom--lg', styles.videoContainer)}>
        <video
          controls
          className={styles.video}
          muted
          autoPlay
          loop
          preload="metadata"
          playsInline
        >
          <source src={source} />
          Your browser does not support the video tag.{' '}
          <a href={source} target="_blank" rel="noopener noreferrer">
            View fileSource
          </a>
          .
        </video>
      </div>
    );
  }

  return (
    <div className="margin-bottom--lg">
      <a href={source} target="_blank" rel="noopener noreferrer">
        View fileSource
      </a>
    </div>
  );
}

export default function DocItemContent({children}: {children: React.ReactNode}) {
  const syntheticTitle = useSyntheticTitle();
  const {frontMatter} = useDoc();
  const fileSource =
    typeof frontMatter.fileSource === 'string' ? frontMatter.fileSource : undefined;

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      {fileSource && <FileSourcePreview source={fileSource} />}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
