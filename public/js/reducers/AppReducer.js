'use strict';

const AppConstants = require('../constants/AppConstants');

const AppReducer = function(state, action) {
    if (typeof state === 'undefined') {
        return  {showVideoModal: false, isKeyAPI: false, status: '',
                 activeRoomExpires: 0, activeRoomURL: null,
                 isClosed: false, userId: null, videoDevice: null,
                 audioDevice: null, devicesInfo: [], joining: false,
                 showStartModal: true, isPrimary: false, outVideoStream: null,
                 invite: false, isMediaPipe: false};
    } else {
        switch(action.type) {
        case AppConstants.APP_UPDATE:
        case AppConstants.APP_NOTIFICATION:
            return Object.assign({}, state, action.state);
        case AppConstants.APP_ERROR:
            return Object.assign({}, state, {error: action.error});
        case AppConstants.WS_STATUS:
            return Object.assign({}, state, {isClosed: action.isClosed});
        default:
            return state;
        }
    };
};

module.exports = AppReducer;
