'use strict';

const caf = require('caf_core');
const app = require('../public/js/app.js');
const APP_SESSION = 'default';

exports.methods = {
    // Methods called by framework
    async __ca_init__() {
        this.state.wab = null;
        this.$.session.limitQueue(1, APP_SESSION); // only the last notification
        this.state.fullName = this.__ca_getAppName__() + '#' +
            this.__ca_getName__();
        return [];
    },
    async __ca_pulse__() {
        this.$.react.render(app.main, [this.state]);
        return [];
    },

    //External methods

    async hello(key) {
        key && this.$.react.setCacheKey(key);
        return this.getState();
    },

    async receiveToken(app, token) {
        // TODO: validate token
        this.state.wab = {app, token};
        this.$.session.notify([{wab: this.state.wab}], APP_SESSION);
        return this.getState();
    },

    async getState() {
        this.$.react.coin();
        return [null, this.state];
    }
};

caf.init(module);
