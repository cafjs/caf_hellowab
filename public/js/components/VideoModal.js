const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

const STATUS = {
    STARTING: 'Starting',
    STARTED: 'Started',
    STOPPING: 'Stopping',
    STOPPED: 'Stopped'
};

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
        this.invite = this.invite.bind(this);
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {showVideoModal: false});
    }

    invite(event) {
        this.doDismiss();
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
            AppActions.startVideoSession(this.props.ctx, duration);
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

        const isVisible = (this.props.status === STATUS.STARTED ?
                           [true, true, true, false] :
                           (this.props.status === STATUS.STOPPED ?
                             [true, true, false, true] :
                            [true, true, false, false])
                          );

        return cE(rB.Modal, {show: this.props.showVideoModal,
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
                         // 1
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
                             ),
                           cE(rB.Col, {sm: 2, xs: 4},
                              cE(rB.Button, {onClick: this.doReset,
                                             bsStyle: 'danger'}, 'Reset')
                             )
                           ),
                         // 2
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
                             ),
                           cE(rB.Col, {sm: 2, xs: 4},
                              cE(rB.Button, {onClick: this.doStop}, 'Stop')
                             )
                           ),
                         // 3
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
                             ),
                           cE(rB.Col, {sm: 2, xs: 4},
                              cE(rB.Button, {onClick: this.doStart}, 'Start')
                             )
                           ),
                     ].filter((x, i) => isVisible[i])
                       ),
                     cE(rB.Modal.Footer, null,
                        cE(rB.ButtonGroup, null,
                           cE(rB.Button, {onClick: this.invite}, 'Invite'),
                           cE(rB.Button, {onClick: this.doDismiss,
                                          bsStyle: 'danger'}, 'Dismiss')
                          )
                       )
                    )
                 );
    }
}

module.exports = VideoModal;
