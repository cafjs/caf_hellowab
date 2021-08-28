'use strict';

const caf = require('caf_core');
const assert = require('assert');
const APP_SESSION = 'default';
const json_rpc = caf.caf_transport.json_rpc;

exports.methods = {
    // Methods called by framework
    async __ca_init__() {
        this.state.wab = null;
        this.$.session.limitQueue(1, APP_SESSION); // only the last notification
        this.state.fullName = this.__ca_getAppName__() + '#' +
            this.__ca_getName__();
        return [];
    },

    //External methods

    async hello(key) {
        return this.getState();
    },

    async receiveToken(app, token) {
        const tokenVal = this.$.security.verifyToken(token);
        const c = json_rpc.splitName(app, json_rpc.APP_SEPARATOR);
        assert.equal(c.length, 2, 'Invalid fqn');
        const [appPublisher, appLocalName] = json_rpc.splitName(c[0]);
        const [caOwner, caLocalName] = json_rpc.splitName(c[1]);

        assert(tokenVal && (caOwner === tokenVal.caOwner) &&
               (caLocalName === tokenVal.caLocalName) &&
               (appPublisher === tokenVal.appPublisher) &&
               (appLocalName === tokenVal.appLocalName), 'Invalid token');

        this.state.wab = {app, token};
        this.$.session.notify([{wab: this.state.wab}], APP_SESSION);
        return this.getState();
    },

    async getState() {
        return [null, this.state];
    }
};

caf.init(module);
