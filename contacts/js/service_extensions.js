'use strict';
/* global utils */
/* global ConfirmDialog */
/* global fb */
/* exported extServices*/

(function(exports) {
  var extServices = {};
  var contactId;

  var extensionFrame = document.querySelector('#fb-extensions');
  var oauthFrame = document.querySelector('#fb-oauth');
  oauthFrame.src = '/shared/import_contacts/oauth.html';
  var currentURI, access_token;
  var canClose = true, canCloseLogout = true;
  var closeRequested = false;

  extServices.startLink = function(cid, linked) {
    canClose = true;
    canCloseLogout = true;
    contactId = cid;
    if (!linked) {
      load('fb_link.html' + '?contactId=' + contactId, 'proposal',
           'facebook');
    } else {
      unlink(contactId);
    }
  };

  extServices.importFB = function(evt) {
    loadService('facebook');
  };

  extServices.importGmail = function(evt) {
    loadService('gmail');
  };

  extServices.importLive = function(evt) {
    loadService('live');
  };

  function loadService(serviceName) {
    closeRequested = false;
    canClose = false;
    canCloseLogout = false;
    load('/shared/import_contacts/import.html?service=' + serviceName,
         'friends', serviceName);
  }

  function load(uri, from, serviceName) {
    oauthFrame.contentWindow.postMessage({
      type: 'start',
      data: {
        from: from,
        service: serviceName
      }
    }, fb.CONTACTS_APP_ORIGIN);
    currentURI = uri;
  }

  function unload() {
    // Attaching again scrolling handlers on the contact list's image loader
    window.dispatchEvent(new CustomEvent('image-loader-resume'));
    extensionFrame.src = currentURI = null;
  }

  function close(messageId, additionalMessageId) {
    extensionFrame.addEventListener('transitionend', function tclose() {
      extensionFrame.removeEventListener('transitionend', tclose);
      extensionFrame.classList.add('hidden');
      if (canClose === true && canCloseLogout === true) {
        unload();
      }
      else {
        closeRequested = true;
      }

      if (messageId) {
        utils.status.show(messageId, additionalMessageId);
      }
    // Otherwise we do nothing as the sync process will finish sooner or later
    });
    extensionFrame.classList.remove('opening');
  }

  function openURL(url) {
    window.open(url, '', 'dialog');
  }

  extServices.showProfile = function(cid) {
    var req = fb.utils.getContactData(cid);

    req.onsuccess = function() {
      var fbContact = new fb.Contact(req.result);

      var uid = fbContact.uid;
      var profileUrl = 'https://m.facebook.com/' + uid;

      openURL(fb.utils.getNonCacheableUrl(profileUrl));
    };

    req.onerror = function() {
      window.console.error('Contacts FB Profile: Contact not found');
    };
  };

  extServices.wallPost = function(cid) {
    contactId = cid;
    fb.msg.ui.wallPost(contactId);
  };

  extServices.sendPrivateMsg = function(cid) {
    contactId = cid;
    fb.msg.ui.sendPrivateMsg(contactId);
  };

  extServices.initEventHandlers = function(socialNode, contact, linked) {
    var elements = {
      '#msg_button': {
        'elems': ['id'],
        'callback': onPrivateMsgClick
      },
      '#wall_button': {
        'elems': ['id'],
        'callback': onWallClick
      },
      '#profile_button': {
        'elems': ['id'],
        'callback': onProfileClick
      },
      '#link_button': {
        'elems': ['id', 'fb_is_linked'],
        'callback': onLinkClick
      }
    };

    // Add extra info too
    var extras = {};
    extras.fb_is_linked = linked;

    /* jshint loopfunc:true */
    for (var nodeName in elements) {
      var node = socialNode.querySelector(nodeName);
      var variables = elements[nodeName].elems;
      variables.forEach(function appendData(data) {
        var value = contact[data] || extras[data];
        node.dataset[data] = value;
      });
      node.addEventListener('click', elements[nodeName].callback);
    }
  };

  function onClickWithId(evt, callback) {
    var contactId = evt.target.dataset.id;
    callback(contactId);
  }

  /*
    The following functons are similar,
    but have been splitted for better reading
    and future different handling
  */
  function onPrivateMsgClick(evt) {
    onClickWithId(evt, extServices.sendPrivateMsg);
  }

  function onWallClick(evt) {
    onClickWithId(evt, extServices.wallPost);
  }

  function onProfileClick(evt) {
    onClickWithId(evt, extServices.showProfile);
  }

  // Note this is slightly different
  function onLinkClick(evt) {
    var contactId = evt.target.dataset.id;
    var linked = evt.target.dataset.fb_is_linked;

    linked = (linked === 'true');
    extServices.startLink(contactId, linked);
  }

  function doLink(fData) {
    var uid = fData.uid;
    // We need to obtain the mozContact id for the UID
    var mozContReq = fb.utils.getMozContact(uid);

    mozContReq.onsuccess = function() {
      // contactId is the device contact about to be linked
      var fbContact = new fb.Contact(null, contactId);

      // mozContactReq.result is id in mozContacts for that UID
      var originalFbContact = mozContReq.result;

      var req = fbContact.linkTo({
        uid: uid,
        photoUrl: fData.url,
        mozContact: originalFbContact
      });

      req.onsuccess = function success() {
        close();

        if (originalFbContact && !fb.isFbLinked(originalFbContact)) {
          window.Contacts && window.Contacts.List.remove(originalFbContact.id);
        }
         window.Contacts && window.Contacts.showContactDetail(contactId);
      };

      req.onerror = function() {
         window.console.error('FB: Error while linking contacts', req.error);
      };
    };

    mozContReq.onerror = function() {
       window.console.error('FB: Error while linking contacts',
                            mozContReq.error);
    };
  }

  function unlink(cid) {
    var msg = 'social-unlink-confirm-title';
    var yesObject = {
      title: 'social-unlink-confirm-accept',
      isDanger: true,
      callback: function onAccept() {
        ConfirmDialog.hide();
        doUnlink(cid);
      }
    };

    var noObject = {
      title: 'cancel',
      callback: function onCancel() {
        ConfirmDialog.hide();
      }
    };

    ConfirmDialog.show(null, msg, noObject, yesObject);
  }

  function doUnlink(cid) {
    var fbContact = new fb.Contact(null, cid);

    var freq = fbContact.unlink();

    freq.onsuccess = function() {
      window.Contacts && window.Contacts.updateContactDetail(cid);
      if (freq.result) {
        window.Contacts && window.Contacts.updateContactDetail(cid);
      }
    };

    freq.onerror = function() {
      window.console.error('FB: Error while unlinking', freq.error);
    };
  }

  function notifySettings(evtype) {
    // Notify observers that a change from FB could have happened
    var eventType = evtype || 'fb_changed';

    var event = new CustomEvent(eventType, {
      'detail' : true
    });

    document.dispatchEvent(event);
  }

  // This function can also be executed when other messages arrive
  // That's why we cannot call notifySettings outside the switch block
  function messageHandler(e) {
    if (!currentURI || e.origin !== fb.CONTACTS_APP_ORIGIN) {
      return;
    }

    var data = e.data;

    switch (data.type) {
      case 'ready':
        extensionFrame.classList.remove('hidden');
        window.setTimeout(function displaying() {
          extensionFrame.classList.add('opening');
          extensionFrame.addEventListener('transitionend', function topen() {
            extensionFrame.removeEventListener('transitionend', topen);
            extensionFrame.contentWindow.postMessage({
              type: 'dom_transition_end',
              data: ''
            }, fb.CONTACTS_APP_ORIGIN);
            // Stop scrolling listeners on the contact list's image loader to
            // prevent images cancelled while friends are being imported
            window.dispatchEvent(new CustomEvent('image-loader-pause'));
          });
        }, 0);
      break;

      case 'authenticated':
        extensionFrame.src = currentURI;
        access_token = data.data;
      break;

      case 'token_stored':
        notifySettings('fb_token_ready');
      break;

      case 'token_error':
        notifySettings('fb_token_error');
      break;

      case 'abort':
        unload();
      break;

      case 'window_close':
        close(data.messageId, data.additionalMessageId);
        notifySettings();
      break;

      case 'import_updated':
        extensionFrame.contentWindow.postMessage({
            type: 'contacts_loaded',
            data: ''
          }, fb.CONTACTS_APP_ORIGIN);
      break;

      case 'sync_finished':
        // Sync finished thus the iframe can be safely "removed"
        canClose = true;
        if (closeRequested && canCloseLogout) {
          unload();
        }

        // Check whether there has been changes or not
        if (data.data > 0) {
          notifySettings();
        }
      break;

      case 'logout_finished':
        canCloseLogout = true;
        if (closeRequested && canClose) {
          unload();
        }
      break;

      case 'item_selected':
        var fData = data.data;
        doLink(fData);

        // Not needed to notifySettings as when settings will be open
        // the info from FB will be refreshed anyway
      break;

      case 'messaging_ready':
        extensionFrame.contentWindow.postMessage({
          type: 'token',
          data: access_token
        }, fb.CONTACTS_APP_ORIGIN);
        break;

    }
  }

  window.addEventListener('message', messageHandler);

  exports.ExtServices = extServices;

}(window));
