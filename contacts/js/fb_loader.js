'use strict';
/* global LazyLoader */
/* exported fbLoader */

var fbLoader = (function() {

  var loaded = false;

  var loadFb = function loadFb() {
    if (loaded) {
      return;
    }

    loaded = true;
    var iframesFragment = document.createDocumentFragment();

    var curtain = document.createElement('iframe');
    curtain.id = 'fb-curtain';
    curtain.src = '/shared/import_contacts/curtain.html';
    iframesFragment.appendChild(curtain);

    var oauth = document.createElement('iframe');
    oauth.id = 'fb-oauth';
    oauth.hidden = true;
    iframesFragment.appendChild(oauth);

    var extensions = document.createElement('iframe');
    extensions.id = 'fb-extensions';
    iframesFragment.appendChild(extensions);

    document.body.appendChild(iframesFragment);

    var scripts = [
      '/shared/contacts/import/utilities/misc/contacts/import/utilities/misc.js',
      '/shared/contacts/import/import_status_data/contacts/import/import_status_data.js',
      '/contacts/js/service_extensions.js',
      '/shared/import_contacts/js/parameters.js',
      '/shared/fb/fb_request/fb/fb_request.js',
      '/shared/contacts/import/facebook/fb_data/contacts/import/facebook/fb_data.js',
      '/shared/contacts/import/facebook/fb_utils/contacts/import/facebook/fb_utils.js',
      '/shared/contacts/import/facebook/fb_query/contacts/import/facebook/fb_query.js',
      '/shared/fb/fb_reader_utils/fb/fb_reader_utils.js',
      '/shared/contacts/import/facebook/fb_contact_utils/contacts/import/facebook/fb_contact_utils.js',
      '/shared/contacts/import/facebook/fb_contact/contacts/import/facebook/fb_contact.js',
      '/contacts/js/fb/fb_link.js',
      '/contacts/js/fb/fb_messaging.js'
    ];

    LazyLoader.load(scripts, function() {
      var event = new CustomEvent('facebookLoaded');
      window.dispatchEvent(event);
    });
  };

  return {
    load: loadFb,
    get loaded() { return loaded; }
  };

})();
