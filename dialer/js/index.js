/* globals KeypadManager, NavbarManager, LazyLoader, CallHandler */
'use strict';

function onLoadDialer() {
  // Dialer chrome UI and keypad UI is visible and already exists in the DOM
  window.performance.mark('navigationLoaded');
  window.performance.mark('visuallyLoaded');

  window.removeEventListener('load', onLoadDialer);

  /* Tell the audio channel manager that we want to adjust the "notification"
   * channel when the user presses the volumeup/volumedown buttons. */
  if (navigator.mozAudioChannelManager) {
    navigator.mozAudioChannelManager.volumeControlChannel = 'notification';
  }

  KeypadManager.init(/* oncall */ false);
  // Keypad (app core content) is now bound
  window.performance.mark('contentInteractive');

  NavbarManager.init();
  // Navbar (chrome) events have now been bound
  window.performance.mark('navigationInteractive');

  setTimeout(function nextTick() {
    var lazyPanels = ['confirmation-message',
                      'edit-mode',
                      'sim-picker'];

    var lazyPanelsElements = lazyPanels.map(function toElement(id) {
      return document.getElementById(id);
    });
    LazyLoader.load(lazyPanelsElements);

    CallHandler.init();
    navigator.mozL10n.once(function loadLazyFilesSet() {
      LazyLoader.load([
        '/shared/fb/fb_request/fb/fb_request.js',
        '/shared/fb/fb_data_reader/fb/fb_data_reader.js',
        '/shared/fb/fb_reader_utils/fb/fb_reader_utils.js',
        '/shared/confirm/confirm.css',
        '/shared/confirm/confirm.js',
        '/shared/config.js',
        '/shared/gaia-header/dist/gaia-header.js',
        '/shared/edit_mode/edit_mode.css'
      ], function fileSetLoaded() {
        window.performance.mark('fullyLoaded');
      });
    });
  });
}

window.addEventListener('load', onLoadDialer);
