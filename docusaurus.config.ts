import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Socratism',
  tagline: '',
  favicon: 'img/planet-favicon-2.png',
  future: {
    v4: true,
  },
  url: 'http://localhost',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap',
      rel: 'stylesheet',
    },
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Socratism',
      items: [
      ],
    },
    footer: {
      style: 'light',
      links: [],
      copyright: '-',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
