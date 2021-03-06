'use strict';
const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

const STATUS = require('./stateConstants');
const videoUtils = require('./videoUtils');

class VideoModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {keyAPI: '', duration: 600};
        this.doDismiss = this.doDismiss.bind(this);
        this.handleKeyAPI = this.handleKeyAPI.bind(this);
        this.submitKeyAPI = this.submitKeyAPI.bind(this);
        this.doKeyAPI = this.doKeyAPI.bind(this);
        this.doReset = this.doReset.bind(this);
        this.doStop = this.doStop.bind(this);
        this.handleDuration = this.handleDuration.bind(this);
        this.submitStart = this.submitStart.bind(this);
        this.doStart = this.doStart.bind(this);
        this.doDevice = this.doDevice.bind(this);
        this.invite = this.invite.bind(this);
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {showVideoModal: false});
    }

    invite(event) {
        //this.doDismiss();
        AppActions.setLocalState(this.props.ctx, {invite: true});
    }

    handleKeyAPI(ev) {
        this.setState({keyAPI: ev.target.value});
    }

    submitKeyAPI(ev) {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            this.doKeyAPI(ev);
        }
    }

    async doDevice(ev) {
        try {
            const devicesInfo =  await videoUtils.getDevicesInfo();
            AppActions.setLocalState(this.props.ctx, {devicesInfo});
            AppActions.setLocalState(this.props.ctx, {showDevicesModal: true});
        } catch (err) {
            console.log(err);
            AppActions.setError(this.props.ctx, err);
        }
    }

    doKeyAPI(ev) {
        if (this.state.keyAPI) {
            AppActions.setDailyKey(this.props.ctx, this.state.keyAPI);
        } else {
            AppActions.setError(this.props.ctx, new Error('Invalid key'));
        }
    }

    handleDuration(ev) {
        this.setState({duration: ev.target.value});
    }

    submitStart(ev) {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            this.doStart(ev);
        }
    }

    doStart(ev) {
        const duration = parseInt(this.state.duration);
        if (isNaN(duration)) {
            AppActions.setError(this.props.ctx, new Error('Invalid duration'));
        } else {
            if (this.props.isKeyAPI) {
                this.doDismiss();
                AppActions.startVideoSession(this.props.ctx, duration);
                // no stalling for the main client
                AppActions.setLocalState(this.props.ctx, {showStartModal: false,
                                                          joining: true});
            } else {
                AppActions.setError(this.props.ctx, new Error('Set the daily' +
                                                              ' key first'));
            }
        }
    }

    doReset(ev) {
        AppActions.stopVideoSession(this.props.ctx, true);
    }

    doStop(ev) {
        AppActions.stopVideoSession(this.props.ctx, false);
    }

    render() {
        const keyMsg = this.props.isKeyAPI ? 'Key OK' : 'Key Missing';

        const primary = !!this.props.isPrimary;

        const isVisible = (this.props.status === STATUS.STARTED ?
                           [true, primary, true, true, true, false] :
                           (this.props.status === STATUS.STOPPED ?
                            [true, primary, true, true, false, primary] :
                            [true, primary, true, true, false, false])
                          );

        const isButtonVisible = (this.props.status === STATUS.STARTED ?
                                 [true, primary, primary, primary, false] :
                                 (this.props.status === STATUS.STOPPED ?
                                  [true, primary, primary, false, primary] :
                                  [true, primary, primary, false, false])
                                );

        return cE(rB.Modal, {show: this.props.showVideoModal &&
                             // give priority to StartModal
                             !(this.props.showStartModal &&
                               (this.props.status === STATUS.STARTED)),
                             onHide: this.doDismiss,
                             animation: false},
                  cE(rB.Modal.Header, {
                      className: 'bg-primary text-primary',
                      style: {textAlign: 'center'},
                      closeButton: true
                  }, cE(rB.Modal.Title, null, 'Video Settings')),

                  cE(rB.Modal.Body, null,
                     cE(rB.Form, {horizontal: true}, [
                         // 0
                         cE(rB.FormGroup, {controlId: 'statusId', key: 344},
                           cE(rB.Col, {sm: 4, xs: 12},
                              cE(rB.ControlLabel, null, 'Status')
                             ),
                           cE(rB.Col, {sm: 6, xs: 8},
                              cE(rB.FormControl, {
                                  type: 'text',
                                  readOnly: true,
                                  value: this.props.status
                              })
                             )
                           ),
                         // 1
                         cE(rB.FormGroup, {controlId: 'keyAPIId', key: 233},
                            cE(rB.Col, {sm: 4, xs: 12},
                               cE(rB.ControlLabel, null, keyMsg)
                              ),
                            cE(rB.Col, {sm: 6, xs: 8},
                               cE(rB.FormControl, {
                                   type: 'text',
                                   value: this.state.keyAPI,
                                   onChange: this.handleKeyAPI,
                                   placeholder: 'daily.co key',
                                   onKeyPress: this.submitKeyAPI,
                               })
                              ),
                            cE(rB.Col, {sm: 2, xs: 4},
                               cE(rB.Button, {onClick: this.doKeyAPI}, 'Update')
                              )
                           ),
                         // 2
                         cE(rB.FormGroup, {controlId: 'videoId', key: 99344},
                            cE(rB.Col, {sm: 4, xs: 12},
                               cE(rB.ControlLabel, null, 'Camera')
                              ),
                            cE(rB.Col, {sm: 6, xs: 8},
                               cE(rB.FormControl, {
                                   type: 'text',
                                   readOnly: true,
                                   value: this.props.videoDevice ?
                                       this.props.videoDevice.text : 'None'
                               })
                              ),
                            cE(rB.Col, {sm: 2, xs: 4},
                               cE(rB.Button, {onClick: this.doDevice}, 'Update')
                              )
                           ),
                         // 3
                         cE(rB.FormGroup, {controlId: 'audioId', key: 99349},
                            cE(rB.Col, {sm: 4, xs: 12},
                               cE(rB.ControlLabel, null, 'Mic')
                              ),
                            cE(rB.Col, {sm: 6, xs: 8},
                               cE(rB.FormControl, {
                                   type: 'text',
                                   readOnly: true,
                                   value: this.props.audioDevice ?
                                       this.props.audioDevice.text : 'None'
                               })
                              ),
                            cE(rB.Col, {sm: 2, xs: 4},
                               cE(rB.Button, {onClick: this.doDevice}, 'Update')
                              )
                           ),

                         // 4
                         cE(rB.FormGroup, {controlId: 'startedId', key: 6344},
                           cE(rB.Col, {sm: 4, xs: 12},
                              cE(rB.ControlLabel, null, 'Expires at')
                             ),
                           cE(rB.Col, {sm: 6, xs: 8},
                              cE(rB.FormControl, {
                                  type: 'text',
                                  readOnly: true,
                                  value: this.props.activeRoomExpires ?
                                      (new Date(this.props.activeRoomExpires *
                                                1000)).toLocaleString() :
                                      ''
                              })
                             )
                           ),
                         // 5
                         cE(rB.FormGroup, {controlId: 'stoppedId', key: 6844},
                           cE(rB.Col, {sm: 4, xs: 12},
                              cE(rB.ControlLabel, null, 'Duration(sec)')
                             ),
                           cE(rB.Col, {sm: 6, xs: 8},
                              cE(rB.FormControl, {
                                  value: this.state.duration,
                                  onChange: this.handleDuration,
                                  onKeyPress: this.submitStart,
                                  type: 'text'
                              })
                             )
                           )
                     ].filter((x, i) => isVisible[i])
                       ),
                     cE(rB.Modal.Footer, null,
                        cE(rB.ButtonGroup, null, [
                            cE(rB.Button, {onClick: this.doDismiss, key: 2233,
                                           bsStyle: 'primary'}, 'Dismiss'),
                            cE(rB.Button, {onClick: this.doReset, key: 2234,
                                           bsStyle: 'danger'}, 'Reset'),
                            cE(rB.Button, {onClick: this.invite, key: 112,
                                           bsStyle: 'primary'}, 'Invite'),
                            cE(rB.Button, {onClick: this.doStop, key: 1121,
                                           bsStyle: 'danger'}, 'Stop'),
                            cE(rB.Button, {onClick: this.doStart, key: 1181,
                                          bsStyle: 'danger'}, 'Start')
                        ].filter((x, i) => isButtonVisible[i])
                          )
                       )
                    )
                 );
    }
}

module.exports = VideoModal;
