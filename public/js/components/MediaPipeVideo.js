'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

const SelfieSegmentation = require('@mediapipe/selfie_segmentation')
      .SelfieSegmentation;

// 720p camera
const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;

const requestFrame = (video, callback) =>
    ('requestVideoFrameCallback' in window.HTMLVideoElement.prototype) ?
      video.requestVideoFrameCallback(callback) :
      requestAnimationFrame(callback);

const cancelFrame = (video, handle) =>
      ('cancelVideoFrameCallback' in window.HTMLVideoElement.prototype) ?
      video.cancelVideoFrameCallback(handle) :
      cancelAnimationFrame(handle);


class MediaPipeVideo extends React.Component {

    constructor(props) {
        super(props);
        this.frameId = null;
        this.video = null;
        this.stream = null;
        this.canvasRef = React.createRef();

        this.onResults = this.onResults.bind(this);
        this.startVideo = this.startVideo.bind(this);
        this.stopVideo = this.stopVideo.bind(this);
        this.onFrame = this.onFrame.bind(this);


        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => `{{__CDN__}}/mediapipe/${file}`
        });
        this.selfieSegmentation.setOptions({
//            useCpuInference: true,
            selfieMode: true,
            modelSelection: 1 // landscape
        });
        this.selfieSegmentation.onResults(this.onResults);

    }


    onResults(results) {
        const canvas = this.canvasRef.current;
        if (canvas) {
            const canvasCtx = canvas.getContext('2d');
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.drawImage(results.segmentationMask, 0, 0,
                                canvas.width, canvas.height);

            // Fill background with green.
            canvasCtx.globalCompositeOperation = 'source-out';
            canvasCtx.fillStyle = '#00FF00'; // solid green
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            // Only overwrite missing pixels.
            canvasCtx.globalCompositeOperation = 'destination-atop';
            canvasCtx.drawImage(
                results.image, 0, 0, canvas.width, canvas.height
            );
            canvasCtx.restore();
        }
    }

    async onFrame() {
        if (this.video) {
            await this.selfieSegmentation.send({image: this.video});
            this.frameId = requestFrame(this.video, this.onFrame);
        }
    }

    async startVideo() {
        if (!this.frameId && !this.video && this.props.videoDevice &&
            this.props.videoDevice.deviceId && this.props.isMediaPipe) {
            this.stream = await navigator.mediaDevices
                .getUserMedia({
                    video: {
                        deviceId: {
                            exact: this.props.videoDevice.deviceId
                        },
                        width: VIDEO_WIDTH,
                        height: VIDEO_HEIGHT
                    }
                });
            const fps = this.stream.getTracks()[0].getSettings().frameRate;
            const canvas = this.canvasRef.current;
            const outVideoStream = canvas.captureStream(fps);
            AppActions.setLocalState(this.props.ctx, {outVideoStream});

            this.video = document.createElement('video');
            //this.video.autoplay = true;
            //this.video.muted = true;
            this.video.srcObject = this.stream;
            this.video.onloadedmetadata = async () => {
                this.video.play();
                await this.selfieSegmentation.initialize();
                this.frameId = requestFrame(this.video, this.onFrame);
            };
        }
    }

    stopVideo() {
        if (this.frameId && this.video) {
            cancelFrame(this.video, this.frameId);
            this.frameId = null;
            this.video = null;
            this.stream && this.stream.getTracks()
                .forEach((track) => track.stop());
            this.stream = null;
            this.selfieSegmentation.reset();
            if (this.props.outVideoStream) {
                this.props.outVideoStream.getTracks()
                    .forEach((track) => track.stop());
                AppActions.setLocalState(this.props.ctx,
                                         {outVideoStream: null});
            }
        }
    }

    componentDidMount() {
        this.startVideo();
    }

    componentDidUpdate(prevProps) {
        const deviceChanged = (prevDev, dev) => (prevDev && !dev) ||
              (!prevDev && dev) || (prevDev && dev &&
                                    (prevDev.deviceId !== dev.deviceId));

        if (this.props.isMediaPipe) {
            if (deviceChanged(prevProps.videoDevice, this.props.videoDevice)) {
                this.stopVideo();
            }
            // idempotent...
            this.startVideo();
        } else {
            this.stopVideo();
        }
    }

    componentWillUnmount() {
        this.stopVideo();

    }

    render() {
        return cE('canvas', {
            ref: this.canvasRef, className: 'mediapipe-canvas'
        });
    }
}


module.exports = MediaPipeVideo;
