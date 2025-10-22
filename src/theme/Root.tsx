import React from 'react';

// Add global logging for debugging
if (typeof window !== 'undefined') {
  const originalSetItem = window.localStorage.setItem;
  window.localStorage.setItem = function(key, value) {
    if (key === 'theme') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[localStorage] Setting theme to:', value);
      console.trace('[localStorage] Stack trace');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    return originalSetItem.apply(this, arguments as any);
  };

  // Also log when data-theme attribute changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' &&
          (mutation.attributeName === 'data-theme' || mutation.attributeName === 'data-theme-choice')) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[DOM] Attribute changed:', mutation.attributeName, '=',
                    document.documentElement.getAttribute(mutation.attributeName));
        console.trace('[DOM] Stack trace');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-theme-choice']
  });
}

export default function Root({children}: {children: React.ReactNode}) {
  return <>{children}</>;
}
