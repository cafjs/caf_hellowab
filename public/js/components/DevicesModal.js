'use strict';
const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

const NO_DEVICE = 'None';

const filterDevices = function(devicesInfo) {
    const video = [{deviceId: null, text: NO_DEVICE}];
    const audio = [{deviceId: null, text: NO_DEVICE}];
    devicesInfo.forEach((deviceInfo) => {
        if (deviceInfo.kind === 'audioinput') {
            const option = {
                deviceId: deviceInfo.deviceId,
                text:  deviceInfo.label || `microphone ${audio.length+1}`
            };
            audio.push(option);
        } else if (deviceInfo.kind === 'videoinput') {
            const option = {
                deviceId: deviceInfo.deviceId,
                text:  deviceInfo.label || `camera ${video.length+1}`
            };
            video.push(option);
        }
    });
    return [video, audio];
};

class DevicesModal extends React.Component {

    constructor(props) {
        super(props);
        this.doDismiss = this.doDismiss.bind(this);
        this.onChangeVideo = this.onChangeVideo.bind(this);
        this.onChangeAudio = this.onChangeAudio.bind(this);
        this.handleGreen = this.handleGreen.bind(this);

        this.state = {
            video: [],
            audio: [] // input...
        };
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.showDevicesModal && this.props.showDevicesModal) {
            console.log('Updating');
            const [video, audio] = filterDevices(this.props.devicesInfo || []);
            this.setState({video, audio});
        }
    }

    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {showDevicesModal: false});
    }

    handleGreen(e) {
        AppActions.setLocalState(this.props.ctx, {isMediaPipe: (e === 1)});
    }

    onChangeAudio(ev) {
        const audioDevice = this.state.audio[ev.target.value];
        const value = audioDevice.text === NO_DEVICE ?
            {audioDevice: null} :
            {audioDevice};
        AppActions.setLocalState(this.props.ctx, value);
    }

    onChangeVideo(ev) {
        const videoDevice = this.state.video[ev.target.value];
        const value = videoDevice.text === NO_DEVICE ?
            {videoDevice: null} :
            {videoDevice};
        AppActions.setLocalState(this.props.ctx, value);
    }

    render() {
        // Array.<{text: string, deviceId: string}>
        const optionsFrom = (devs) => {
            return devs.map((dev, i) => cE('option', {key: i, value: i},
                                           dev.text));
        };

        return cE(rB.Modal, {show: this.props.showDevicesModal,
                             onHide: this.doDismiss,
                             animation: false},
                  cE(rB.Modal.Header, {
                      className: 'bg-primary text-primary',
                      style: {textAlign: 'center'},
                      closeButton: true
                  }, cE(rB.Modal.Title, null, 'Change Input Devices')),

                  cE(rB.Modal.Body, null,
                     cE(rB.Form, {horizontal: true}, [
                         cE(rB.FormGroup, {controlId: 'audioId', key: 344},
                             cE(rB.Col, {sm: 4, xs: 12},
                               cE(rB.ControlLabel, null, 'Mic')
                               ),
                            cE(rB.Col, {sm: 8, xs: 8},
                               cE(rB.FormControl, {
                                   componentClass: 'select',
                                   multiple: true,
                                   onChange: this.onChangeAudio
                               },
                                  optionsFrom(this.state.audio)
                                 )
                              )
                           ),
                         cE(rB.FormGroup, {controlId: 'videoId', key: 244},
                             cE(rB.Col, {sm: 4, xs: 12},
                               cE(rB.ControlLabel, null, 'Camera')
                               ),
                            cE(rB.Col, {sm: 8, xs: 8},
                               cE(rB.FormControl, {
                                   componentClass: 'select',
                                   multiple: true,
                                   onChange: this.onChangeVideo
                               },
                                  optionsFrom(this.state.video)
                                 )
                              )
                           ),
                         cE(rB.FormGroup, {controlId: 'greenId', key: 9944},
                             cE(rB.Col, {sm: 4, xs: 12},
                               cE(rB.ControlLabel, null, 'Green Screen')
                               ),
                            cE(rB.Col, {sm: 8, xs: 8},
                               cE(rB.ToggleButtonGroup, {
                                   type: 'radio',
                                   name : 'daemon',
                                   value: this.props.isMediaPipe ? 1 : 0,
                                   onChange: this.handleGreen
                               },
                                  cE(rB.ToggleButton, {value: 0}, 'Off'),
                                  cE(rB.ToggleButton, {value: 1}, 'On')
                                 )
                              )
                           )                     ]
                       )
                    ),
                  cE(rB.Modal.Footer, null,
                        cE(rB.ButtonGroup, null,
                           cE(rB.Button, {onClick: this.doDismiss, key: 2233,
                                          bsStyle: 'primary'}, 'Update')
                          )
                    )
                 );
    }
}

module.exports = DevicesModal;
