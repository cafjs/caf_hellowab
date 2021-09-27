'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const THREE = require('three');
const DailyVideo = require('./DailyVideo');
const MediaPipeVideo = require('./MediaPipeVideo');
const {requestFrame, cancelFrame} = require('./videoUtils');

const FRUSTUM = 2;
const VIDEO_ASPECT = 16/9; //720p, 1080p,...

const RGBToUV = function(r,g,b) {
    const rN = r/255.0;
    const gN = g/255.0;
    const bN = b/255.0;
    const y =  0.299 * rN + 0.587 * gN + 0.114 * bN;
    const cR = rN - y;
    const cB =  bN - y;
    return [cR, cB];
};

const KEY_UV = RGBToUV(0, 255, 0);

const VERTEX_SHADER =
      `
      varying vec2 uvV;
      void main(void) {
          uvV = uv;
          gl_Position =  projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
`;

const FRAGMENT_SHADER =
      `
        uniform vec2 keyUV;
        uniform float similarity;
        uniform float smoothness;
        varying vec2 uvV;
        uniform vec2 uvOffset;
        uniform sampler2D map;
        void main() {
            vec4 videoColor = texture2D(map, uvV + uvOffset);

            float y = 0.299 * videoColor.r + 0.587 * videoColor.g + 0.114 * videoColor.b;
            float cR = videoColor.r - y;
            float cB = videoColor.b - y;

            float blend = smoothstep(similarity, similarity + smoothness, distance(vec2(cR, cB), keyUV));
            gl_FragColor = vec4(videoColor.rgb, videoColor.a * blend);
        }

`;



class TalkingHead extends React.Component {

    constructor(props) {
        super(props);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.animate = this.animate.bind(this);
        this.frameId = null;
        this.soundRef = React.createRef();
        this.videoRef = {current: null};
    }

    onWindowResize() {
        if (this.camera && this.renderer) {
            const aspect = window.innerWidth / window.innerHeight;
            this.camera.left = -FRUSTUM * aspect / 2;
            this.camera.right = FRUSTUM * aspect / 2;
            this.camera.top = FRUSTUM  / 2;
            this.camera.bottom = -FRUSTUM / 2;
            let xOffset = FRUSTUM*(VIDEO_ASPECT - 2*aspect)/4;
            xOffset = xOffset > 0 ? 0 : xOffset;
            this.camera.position.x = xOffset;

            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    animate() {
        this.renderer.render(this.scene, this.camera);
        const video = this.videoRef.current;
        this.frameId = requestFrame(video, this.animate);
    }

    componentDidMount() {
        this.videoRef.current = document.createElement('video');
        this.videoRef.current.autoplay = true;
        this.videoRef.current.muted = true;
        this.videoRef.current.setAttribute('playsinline', true);

        const canvas = document.getElementById('canvas-head');
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas,
            alpha: true,
            premultipliedAlpha: false
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(
            -FRUSTUM * aspect / 2,
            FRUSTUM * aspect / 2,
            FRUSTUM / 2,
            -FRUSTUM / 2,
            1,
            1000
        );
        this.camera.position.z = 10;
        this.camera.position.y = FRUSTUM/4;
        let xOffset = FRUSTUM*(VIDEO_ASPECT - 2*aspect)/4;
        xOffset = xOffset > 0 ? 0 : xOffset;
        this.camera.position.x = xOffset;
        this.scene = new THREE.Scene();

        const video = this.videoRef.current;
        this.texture = new THREE.VideoTexture(video);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        const material = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                map: {value: this.texture},
                keyUV: { value: KEY_UV },
                uvOffset: {value: [0.0, 0.0]},
                similarity: { value: 0.5 },
                smoothness: { value: 0.3 }
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER
        });

        const geometry = new THREE.PlaneGeometry(VIDEO_ASPECT*FRUSTUM/2,
                                                 FRUSTUM/2);
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        if (this.props.blur) {
            // center talking head, make it larger
            this.camera.position.x = 0;
            this.camera.position.y = FRUSTUM/8;
            this.mesh.scale.set(1.5, 1.5, 1.0);
        }

        if (!this.frameId) {
            this.frameId = requestFrame(video, this.animate);
            window.addEventListener('resize', this.onWindowResize);
        }
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.blur && this.props.blur) {
            // center talking head, make it larger
            this.camera.position.x = 0;
            this.camera.position.y = FRUSTUM/8;
            this.mesh.scale.set(1.5, 1.5, 1.0);
        }

        if (prevProps.blur && !this.props.blur) {
            // undo changes, see componentDidMount()
            this.camera.position.y = FRUSTUM/4;
            const aspect = window.innerWidth / window.innerHeight;
            let xOffset = FRUSTUM*(VIDEO_ASPECT - 2*aspect)/4;
            xOffset = xOffset > 0 ? 0 : xOffset;
            this.camera.position.x = xOffset;
            this.mesh.scale.set(1.0, 1.0, 1.0);
        }
    }

    componentWillUnmount() {
        const video = this.videoRef.current;
        this.frameId && cancelFrame(video, this.frameId);
        this.frameId = null;
        window.removeEventListener('resize', this.onWindowResize);
    }

    render() {
        return cE(React.Fragment, null,
                  cE('audio', {autoPlay: true, playsInline: true,
                               ref: this.soundRef}),
                  cE(MediaPipeVideo, {
                      ctx: this.props.ctx,
                      videoDevice: this.props.videoDevice,
                      isMediaPipe: this.props.isMediaPipe,
                      outVideoStream: this.props.outVideoStream
                  }),
                  cE(DailyVideo, {
                      ctx: this.props.ctx,
                      soundRef: this.soundRef,
                      videoRef: this.videoRef,
                      isMediaPipe: this.props.isMediaPipe,
                      outVideoStream: this.props.outVideoStream,
                      userId: this.props.userId,
                      activeRoomURL: this.props.activeRoomURL,
                      roomStatus: this.props.status,
                      videoDevice: this.props.videoDevice,
                      audioDevice: this.props.audioDevice,
                      joining: this.props.joining
                  })
                 );
    }
}

module.exports = TalkingHead;
