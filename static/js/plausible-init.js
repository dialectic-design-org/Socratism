(() => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  if (isLocal) {
    window.plausible = () => undefined;
    window.plausible.init = () => undefined;
    window.plausible.q = [];
    return;
  }

  window.plausible =
    window.plausible ||
    function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
  window.plausible.init =
    window.plausible.init ||
    function (options) {
      window.plausible.o = options || {};
    };
  window.plausible.init();
})();
