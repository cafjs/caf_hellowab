'use strict';
const DailyIframe = require('@daily-co/daily-js');
const React = require('react');
const cE = React.createElement;

const AppActions = require('../actions/AppActions');

const ROOM_STATUS = {
    STARTING: 'Starting',
    STARTED: 'Started',
    STOPPING: 'Stopping',
    STOPPED: 'Stopped'
};

const STATUS = {
    IDLE: 'Idle',
    JOINING: 'Joining',
    JOINED: 'Joined',
    REGISTERED: 'Registered',
    ERROR: 'Error'
};

class DailyVideo extends React.Component {

    constructor(props) {
        super(props);
        this.callObject = null;
        this.state = {
            status: STATUS.IDLE,
            counter: 0
        };
        this.videoDeviceId = null;
        this.videoSource = null;
        this.audioDeviceId = null;

        this.updateInputs = this.updateInputs.bind(this);
        this.handleMeetingState = this.handleMeetingState.bind(this);
        this.handleParticipantsChange = this.handleParticipantsChange
            .bind(this);
    }

    handleMeetingState(event)  {
        switch (this.callObject.meetingState()) {
        case 'joined-meeting':
            this.setState({status: STATUS.JOINED});
            break;
        case 'left-meeting':
            this.setState({status: STATUS.IDLE});
            break;
        case 'error':
            console.log(event);
            this.setState({status: STATUS.ERROR});
            const err = new Error('Disconnected, please reload');
            err['reload'] = true;
            AppActions.setError(this.props.ctx, err);
            break;
        default:
            break;
        }
    }

    handleParticipantsChange(event) {
        // Dummy update to invoke componentDidUpdate()
        this.setState({counter: this.state.counter + 1});
    }

    updateInputs() {
        /* Video has three states: NONE, DEVICE_ID, and SRC
         * depending on whether we use the mediapipe green screen or not.
         *
         * The states are encoded using videoDeviceId and videoSource, i.e.,
         *
         * NONE -> (videoDeviceId = null, videoSource = null)
         * DEVICE_ID -> (videoDeviceId = number, videoSource = null)
         * SRC -> (videoDeviceId = null, videoSource = MediaStream)
         *
         * We have to handle 8 state transitions:
         *
         * NONE -> DEVICE_ID   if !isMediaPipe && deviceId
         * NONE -> SRC         if isMediaPipe && outVideoStream
         * DEVICE_ID -> NONE   if (isMediaPipe && !outVideoStream) ||
         *                        (!isMediaPipe && !deviceId)
         * DEVICE_ID -> SRC    if isMediaPipe && outVideoStream
         * DEVICE_ID -> DEVICE_ID if !isMediaPipe && (deviceId !==videoDeviceId)
         * SRC-> NONE          if (!isMediaPipe && !deviceId) ||
         *                        (isMediaPipe && !outVideoStream)
         * SRC -> DEVICE_ID    if (!isMediaPipe && deviceId)
         * SRC -> SRC          if (isMediaPipe && (outVideoStream!==videoSource)
         *
         * And they will trigger an update with the new state...
         */
        let doUpdate = false;

        if (!this.videoDeviceId && !this.videoSource) {
            // State NONE
            if (!this.props.isMediaPipe && this.props.videoDevice &&
                this.props.videoDevice.deviceId) {
                // to DEVICE_ID
                this.videoDeviceId = this.props.videoDevice.deviceId;
                doUpdate = true;
            }
            if (this.props.isMediaPipe && this.props.outVideoStream) {
                // to SRC
                this.videoSource = this.props.outVideoStream;
                doUpdate = true;
            }
        } else if (this.videoDeviceId && !this.videoSource) {
            // State DEVICE_ID
            if ((this.props.isMediaPipe && !this.props.outVideoStream) ||
                (!this.props.isMediaPipe &&
                 !(this.props.videoDevice &&
                   this.props.videoDevice.deviceId))) {
                // to NONE
                this.videoDeviceId = null;
                doUpdate = true;
            }
            if (this.props.isMediaPipe && this.props.outVideoStream) {
                // to SRC
                this.videoDeviceId = null;
                this.videoSource = this.props.outVideoStream;
                doUpdate = true;
            }
            if (!this.props.isMediaPipe && this.props.videoDevice &&
                (this.videoDeviceId !== this.props.videoDevice.deviceId)) {
                // to DEVICE_ID
                this.videoDeviceId = this.props.videoDevice.deviceId;
                doUpdate = true;
            }
        } else if (!this.videoDeviceId && this.videoSource) {
            // State SRC
            if ((!this.props.isMediaPipe &&
                 !(this.props.videoDevice &&
                   this.props.videoDevice.deviceId)) ||
                (this.props.isMediaPipe && !this.props.outVideoStream)) {
                // to NONE
                this.videoSource = null;
                doUpdate = true;
            }
            if (!this.props.isMediaPipe && (this.props.videoDevice &&
                                            this.props.videoDevice.deviceId)) {
                // to DEVICE_ID
                this.videoDeviceId = this.props.videoDevice.deviceId;
                this.videoSource = null;
                doUpdate = true;
            }
            if (this.props.isMediaPipe &&
                (this.props.outVideoStream !== this.videoSource)) {
                // to SRC
                this.videoSource = this.props.outVideoStream;
                doUpdate = true;
            }
        } else {
            throw new Error('BUG: Invalid state in input');
        }

        if (this.props.audioDevice &&
            (this.props.audioDevice.deviceId !== this.audioDeviceId)) {
            this.audioDeviceId = this.props.audioDevice.deviceId;
            doUpdate = true;
        }

        if (doUpdate) {
            const update = this.videoDeviceId ?
                {videoDeviceId: this.videoDeviceId} :
                {};

            if (this.videoSource) {
                update['videoSource'] = this.videoSource.getVideoTracks()[0];
            }

            if (this.audioDeviceId) {
                update['audioDeviceId'] = this.audioDeviceId;
            }
            this.callObject.setInputDevicesAsync(update);
        }
    }

    componentDidMount() {
        this.callObject = DailyIframe.createCallObject({
            audioSource: false,
            videoSource: false
        });
        this.updateInputs();
        this.callObject.on('joined-meeting', this.handleMeetingState);
        this.callObject.on('left-meeting', this.handleMeetingState);
        this.callObject.on('error', this.handleMeetingState);

        this.callObject.on('participant-joined', this.handleParticipantsChange);
        this.callObject.on('participant-left', this.handleParticipantsChange);

        // trigger componentDidUpdate
        this.setState({counter: this.state.counter + 1});
    }

    componentDidUpdate(prevProps) {
        this.updateInputs();

        if ((this.props.roomStatus === ROOM_STATUS.STARTED) &&
            this.props.activeRoomURL && this.props.joining) {
            /* IDLE->JOINING->JOINED->REGISTERED
               ERROR never recovers, i.e., client reloads.
               No explicit 'leave meeting', keep callObject until unmount.
             */
            switch(this.state.status) {
            case STATUS.IDLE:
                this.callObject.join({url: this.props.activeRoomURL});
                this.setState({status: STATUS.JOINING});
                break;
            case STATUS.JOINED:
                const all = this.callObject.participants();
                if (all && all.local) {
                    const userId = all.local.user_id;
                    if (userId) {
                        AppActions.setTalkingHeadId(this.props.ctx, userId);
                        this.setState({status: STATUS.REGISTERED});
                    }
                }
                break;
            case STATUS.REGISTERED:
                if (this.props.userId) {
                    const all = this.callObject.participants();
                    Object.keys(all).forEach((key) => {
                        const x = all[key];
                        if (x.user_id === this.props.userId) {
                            let videoTrack = null;
                            let audioTrack = null;
                            if (key === 'local') {
                                videoTrack = x.videoTrack;
                                // Do not echo...
                                // audioTrack = x.audioTrack;
                            } else {
                                if (x.tracks.video.state === 'loading') {
                                    // ensure that we retry
                                    setTimeout(() =>
                                               this.setState({
                                                   counter: this.state.counter +
                                                       1}), 100);
                                }
                                videoTrack = x.tracks.video.track;
                                audioTrack = x.tracks.audio.track;
                            }
                            this.props.videoRef.current.srcObject =
                                videoTrack ?
                                new window.MediaStream([videoTrack]) :
                                null;
                            this.props.soundRef.current.srcObject =
                                audioTrack ?
                                new window.MediaStream([audioTrack]) :
                                null;
                        }
                    });
                }
                break;
            case STATUS.JOINING:
            case STATUS.ERROR:
                // Ignore
            }
        }
    }

    componentWillUnmount() {
        if (this.callObject) {
            this.callObject.destroy();
            this.callObject.off('joined-meeting', this.handleMeetingState);
            this.callObject.off('left-meeting', this.handleMeetingState);
            this.callObject.off('error', this.handleMeetingState);

            this.callObject.off('participant-joined',
                                this.handleParticipantsChange);
            this.callObject.off('participant-left',
                                this.handleParticipantsChange);
        }
    }

    render() {
        return cE('div', null);
    }
}

module.exports = DailyVideo;
