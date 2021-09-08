'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const STATUS = require('./stateConstants');

const getDevicesInfo = async () => {
    // trigger user permission ack to enable enumeration
    const stream = await navigator.mediaDevices
          .getUserMedia({audio: true, video: true});
    const devicesInfo = await navigator.mediaDevices
          .enumerateDevices();
    stream.getTracks().forEach((track) => track.stop());
    return devicesInfo;
};

class StartModal extends React.Component {

    constructor(props) {
        super(props);
        this.doDismiss = this.doDismiss.bind(this);
        this.doJoin = this.doJoin.bind(this);
        this.doDevice = this.doDevice.bind(this);
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {showStartModal: false});
    }

    async doDevice(ev) {
        try {
            const devicesInfo = await getDevicesInfo();
            AppActions.setLocalState(this.props.ctx, {devicesInfo});
            AppActions.setLocalState(this.props.ctx, {showDevicesModal: true});
        } catch (err) {
            console.log(err);
            AppActions.setError(this.props.ctx, err);
        }
     }

    async doJoin(ev) {
        try {
            const devicesInfo = await getDevicesInfo();
            AppActions.setLocalState(this.props.ctx, {devicesInfo});
            AppActions.setLocalState(this.props.ctx, {joining: true});
            this.doDismiss();
        } catch (err) {
            console.log(err);
            AppActions.setError(this.props.ctx, err);
        }
    }

    render() {
        return cE(rB.Modal, {show: this.props.showStartModal &&
                             (this.props.status === STATUS.STARTED),
                             onHide: this.doDismiss,
                             animation: false},
                  cE(rB.Modal.Header, {
                      className: 'bg-primary text-primary',
                      style: {textAlign: 'center'},
                      closeButton: true
                  }, cE(rB.Modal.Title, null, 'Meeting in Progress')),

                 cE(rB.Modal.Body, null,
                    cE(rB.Form, {horizontal: true}, [
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
                           )
                        ]
                      ),
                    cE(rB.Modal.Footer, null,
                       cE(rB.ButtonGroup, null, [
                           cE(rB.Button, {onClick: this.doDismiss, key: 2233,
                                          bsStyle: 'primary'}, 'Dismiss'),
                           cE(rB.Button, {onClick: this.doJoin, key: 2234,
                                           bsStyle: 'danger'}, 'Join')
                       ])
                      )
                   )
                );
    }
}

module.exports = StartModal;
