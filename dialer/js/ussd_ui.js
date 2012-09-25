'use strict';

var UssdUI = {

  _: window.navigator.mozL10n.get,

  get closeNode() {
    delete this.closeNode;
    return this.closeNode = document.getElementById('close');
  },

  get sendNode() {
    delete this.sendNode;
    return this.sendNode = document.getElementById('send');
  },

  get messageNode() {
    delete this.messageNode;
    return this.messageNode = document.getElementById('message');
  },

  get responseTextNode() {
    delete this.responseTextNode;
    return this.responseTextNode = document.getElementById('response-text');
  },

  get responseTextResetNode() {
    delete this.responseTextResetNode;
    return this.responseTextResetNode =
      document.getElementById('response-text-reset');
  },

  init: function uui_init() {
    this.closeNode.addEventListener('click', this);
    this.sendNode.addEventListener('click', this);
    this.responseTextResetNode.addEventListener('click', this);
    this.responseTextNode.addEventListener('input', this);
    this._origin = document.location.protocol + '//' +
      document.location.host;
    window.addEventListener('message', this);
  },

  closeWindow: function uui_close() {
    window.opener.postMessage({
      type: 'close'
    }, this._origin);

    window.close();
  },

  showMessage: function uui_showMessage(message) {
    document.body.classList.remove('loading');
    this.responseTextNode.removeAttribute('disabled');
    this.messageNode.textContent = message;
  },

  showLoading: function uui_showLoading() {
    document.body.classList.add('loading');
    this.responseTextNode.setAttribute('disabled', 'disabled');
    this.sendNode.setAttribute('disabled', 'disabled');
  },

  resetResponse: function uui_resetResponse() {
    this.responseTextNode.value = '';
    this.sendNode.setAttribute('disabled', 'disabled');
  },

  responseUpdatedHandler: function uui_responseUpdatedHandler() {
    if (this.responseTextNode.value.length > 0)
      this.sendNode.removeAttribute('disabled');
    else
      this.sendNode.setAttribute('disabled', 'disabled');
  },

  reply: function uui_reply() {
    this.showLoading();
    var response = this.responseTextNode.value;
    window.opener.postMessage({
      type: 'reply',
      message: response
    }, this._origin);
    this.resetResponse();
  },

  handleEvent: function ph_handleEvent(evt) {
    if (evt.type === 'input' && evt.target === this.responseTextNode) {
      this.responseUpdatedHandler();
    } else if (evt.type === 'click' && evt.target === this.sendNode) {
      this.reply();
    } else if (evt.type === 'click' &&
      evt.target === this.responseTextResetNode) {
      this.resetResponse();
      evt.stopPropagation();
      evt.preventDefault();
    } else if (evt.type === 'click' && evt.target === this.closeNode) {
      this.closeWindow();
    } else if (evt.type === 'message' && evt.data === 'noresponse') {
      this.showMessage(this._('no-response-from-server'));
    } else if (evt.type === 'message') {
      this.showMessage(evt.data);
    }
  }
};

window.addEventListener('localized', function usui_startup(evt) {
  UssdUI.init();
});

