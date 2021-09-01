'use strict';

const caf = require('caf_core');
const assert = require('assert');
const APP_SESSION = 'default';
const USER_SESSION = /^user/;
const json_rpc = caf.caf_transport.json_rpc;

const STATUS = {
    STARTING: 'starting',
    STARTED: 'started',
    STOPPING: 'stopping',
    STOPPED: 'stopped'
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

const isActive = function(self) {
    if (!self.state.activeRoomName) {
        return false;
    } else {
        const newState = mergeState(self);
        return !!newState.activeRoomURL;
    }
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

    async __ca_handleDaily__(id,  response) {
        const [err, data] = response;
        this.$.log.debug(`handle: id ${id} and ` +
                         `response ${JSON.stringify(response)}`);
        if ((id.indexOf('create_') === 0)) {
            if (id === `create_${this.state.activeRoomName}`) {
                notifyWebApp(this, `Starting ${this.state.activeRoomName}`);
            }
        } else if ((id.indexOf('delete_') === 0)) {
            if (id === `delete_${this.state.activeRoomName}`) {
                const lastRoomName = this.state.activeRoomName;
                delete this.state.activeRoomName;
                notifyWebApp(this, `Stopping ${lastRoomName}`);
            }
        } else {
            this.$.log.warn(`Ignoring ${id}`);
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
