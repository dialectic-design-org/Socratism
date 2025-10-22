import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {translate} from '@docusaurus/Translate';
import type {ColorMode} from '@docusaurus/theme-common';
import type {Props} from '@theme/ColorModeToggle';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './styles.module.css';

function getNextColorMode(
  colorMode: ColorMode | null,
  respectPrefersColorScheme: boolean,
) {
  if (!respectPrefersColorScheme) {
    return colorMode === 'dark' ? 'light' : 'dark';
  }

  switch (colorMode) {
    case null:
      return 'light';
    case 'light':
      return 'dark';
    case 'dark':
      return null;
    default:
      throw new Error(`unexpected color mode ${colorMode}`);
  }
}

function getColorModeLabel(colorMode: ColorMode | null): string {
  switch (colorMode) {
    case null:
      return translate({
        message: 'system mode',
        id: 'theme.colorToggle.ariaLabel.mode.system',
        description: 'The name for the system color mode',
      });
    case 'light':
      return translate({
        message: 'light mode',
        id: 'theme.colorToggle.ariaLabel.mode.light',
        description: 'The name for the light color mode',
      });
    case 'dark':
      return translate({
        message: 'dark mode',
        id: 'theme.colorToggle.ariaLabel.mode.dark',
        description: 'The name for the dark color mode',
      });
    default:
      throw new Error(`unexpected color mode ${colorMode}`);
  }
}

function getColorModeAriaLabel(colorMode: ColorMode | null) {
  return translate(
    {
      message: 'Switch between dark and light mode (currently {mode})',
      id: 'theme.colorToggle.ariaLabel',
      description: 'The ARIA label for the color mode toggle',
    },
    {
      mode: getColorModeLabel(colorMode),
    },
  );
}

function CubeIcon({mode}: {mode: ColorMode | null}): ReactNode {
  const isDark = mode === 'dark';
  return (
    <span className="cube-toggle" aria-hidden="true">
      <span className="cube-toggle__orbit cube-toggle__orbit--x">
        <span className="cube-toggle__orbit cube-toggle__orbit--y">
          <span className="cube-toggle__orbit cube-toggle__orbit--z">
            <span className="cube-toggle__cube" data-dark={isDark ? 'true' : 'false'}>
              {Array.from({length: 6}).map((_, index) => (
                <span key={index} />
              ))}
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

function ColorModeToggle({
  className,
  buttonClassName,
  respectPrefersColorScheme,
  value,
  onChange,
}: Props): ReactNode {
  const isBrowser = useIsBrowser();
  const location = useLocation();
  const {siteConfig} = useDocusaurusContext();
  const baseUrl = siteConfig?.baseUrl ?? '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPathname = location.pathname.endsWith('/')
    ? location.pathname
    : `${location.pathname}/`;
  const hideToggle = normalizedPathname === normalizedBaseUrl;

  console.log('[ColorModeToggle] Render:', {
    pathname: location.pathname,
    normalizedPathname,
    normalizedBaseUrl,
    hideToggle,
    currentValue: value,
    respectPrefersColorScheme,
    isBrowser,
  });

  if (hideToggle) {
    console.log('[ColorModeToggle] Hidden on homepage');
    return null;
  }

  const handleClick = () => {
    const nextMode = getNextColorMode(value, respectPrefersColorScheme);
    console.log('[ColorModeToggle] Button clicked:', {
      currentMode: value,
      nextMode,
      respectPrefersColorScheme,
    });
    onChange(nextMode);
  };

  return (
    <div className={clsx(styles.toggle, className)}>
      <button
        className={clsx(
          'clean-btn',
          styles.toggleButton,
          !isBrowser && styles.toggleButtonDisabled,
          buttonClassName,
        )}
        type="button"
        onClick={handleClick}
        disabled={!isBrowser}
        title={getColorModeLabel(value)}
        aria-label={getColorModeAriaLabel(value)}>
        <CubeIcon mode={value} />
      </button>
    </div>
  );
}

export default React.memo(ColorModeToggle);
