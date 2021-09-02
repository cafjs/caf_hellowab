/*!
Copyright 2020 Caf.js Labs and contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

const caf = require('caf_core');
const assert = require('assert');
const APP_SESSION = 'default';
const USER_SESSION = /^user/;
const json_rpc = caf.caf_transport.json_rpc;

const STATUS = {
    STARTING: 'Starting',
    STARTED: 'Started',
    STOPPING: 'Stopping',
    STOPPED: 'Stopped'
};

const mergeState = function(self) {
    const dailyInfo = self.$.daily.getDailyInfo();
    const isKeyAPI = dailyInfo.isKeyAPI;
    const activeRoomURL = null;
    const activeRoomExpires = 0;
    if (self.state.activeRoomName) {
        dailyInfo.rooms.forEach((room) => {
            if (room.name === self.state.activeRoomName) {
                activeRoomURL = room.url;
                activeRoomExpires = room.expires;
            }
        });
    }
    return {...self.state, isKeyAPI, activeRoomURL, activeRoomExpires};
};

const notifyWebApp = function(self, msg) {
    msg && self.$.log && self.$.log.debug(msg);
    const newState = mergeState(self);
    self.$.session.notify([newState], APP_SESSION);
    self.$.session.notify([newState], USER_SESSION);
};

exports.methods = {
    // Methods called by framework
    async __ca_init__() {
        this.state.wab = null;
        this.$.session.limitQueue(1, APP_SESSION); // only the last notification
        this.state.fullName = this.__ca_getAppName__() + '#' +
            this.__ca_getName__();
        this.$.daily.setHandleReplyMethod('__ca_handleDaily__');
        this.state.activeRoomName = null;
        this.state.status = STATUS.STOPPED;
        return [];
    },

    async __ca_pulse__() {
        if (this.state.status === STATUS.STARTED) {
            const newState = mergeState(this);
            if (newState.activeRoomExpires) {
                const now = Date.now()/1000;
                if (now > newState.activeRoomExpires) {
                    // cleanup
                    this.stopVideoSession(true);
                }
            }
        } else if ((this.state.status === STATUS.STARTING) ||
                   (this.state.status === STATUS.STOPPING)) {
            const now = Date.now();
            if (now - this.state.startedTransition > this.$.props.timeoutMsec) {
                this.$.log.warn('Timeout: Cannot start or stop');
                // cleanup
                this.stopVideoSession(true);
            }
        }

        return [];
    },

    async __ca_handleDaily__(id,  response) {
        const [err, data] = response;
        this.$.log.debug(`handle: id ${id} and ` +
                         `response ${JSON.stringify(response)}`);

        if (err) {
            const lastRoomName = this.state.activeRoomName;
            this.state.status = STATUS.STOPPED;
            delete this.state.activeRoomName;
            notifyWebApp(this, `Stopped ${lastRoomName} after error ` +
                         `${err}`);
        } else if ((this.state.status === STATUS.STARTING) &&
                   (id === `create_${this.state.activeRoomName}`)) {
            this.state.status = STATUS.STARTED;
            notifyWebApp(this, `Started ${this.state.activeRoomName}`);
        } else if ((this.state.status === STATUS.STOPPING) &&
                   (id === `delete_${this.state.activeRoomName}`)) {
            this.state.status = STATUS.STOPPED;
            const lastRoomName = this.state.activeRoomName;
            delete this.state.activeRoomName;
            notifyWebApp(this, `Stopped ${lastRoomName}`);
        } else {
            // Ignoring
            this.$.log.debug(`Ignoring response ${id} in status ` +
                             `${this.state.status}`);
        }
        return [];
    },

    //External methods

    async hello(key) {
        return this.getState();
    },

    async setDailyKey(key) {
        this.$.daily.setKeyAPI(key);
        return [];
    },

    async startVideoSession(durationInSec) {
        assert(typeof durationInSec === 'number');
        switch (this.state.status) {
        case STATUS.STOPPED:
            this.state.status = STATUS.STARTING;
            this.state.startedTransition = Date.now();
            const id = this.$.daily.createRoom(durationInSec);
            assert((id.indexOf('create_') === 0));
            this.state.activeRoomName = id.slice(7);
            break;
        case STATUS.STARTING:
        case STATUS.STARTED:
        case STATUS.STOPPING:
            // Ignore, use stop with 'force' if needed...
            this.$.log.debug(`Ignoring start in ${this.state.status}`);
        }
        return this.getState();
    },

    async stopVideoSession(force) {
        if (force) {
            // May leave rooms running...
            this.state.activeRoomName &&
                this.$.daily.deleteRoom(this.state.activeRoomName);
            this.state.activeRoomName = null;
            this.state.status = STATUS.STOPPED;
            notifyWebApp(this, `Stopping session FORCED`);
        } else {
            switch (this.state.status) {
            case STATUS.STARTED:
                this.state.status = STATUS.STOPPING;
                this.state.startedTransition = Date.now();
                this.state.activeRoomName &&
                    this.$.daily.deleteRoom(this.state.activeRoomName);
                break;
            case STATUS.STARTING:
            case STATUS.STOPPING:
            case STATUS.STOPPED:
                // Ignore, use 'force' if needed...
                this.$.log.debug(`Ignoring stop in ${this.state.status}`);
            }
        }
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
        return [null, mergeState(this)];
    }
};

caf.init(module);
