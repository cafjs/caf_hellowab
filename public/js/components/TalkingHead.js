'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const THREE = require('three');
const DailyVideo = require('./DailyVideo');

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
        this.frameId = window.requestAnimationFrame(this.animate);
    }

    componentDidMount() {
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

        const video = document.getElementById('video-head');
        this.texture = new THREE.VideoTexture(video);
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        const material = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                map: {value: this.texture},
                keyUV: { value: KEY_UV },
                uvOffset: {value: [0.0, 0.0]},
                similarity: { value: 0.7 },
                smoothness: { value: 0.0 }
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER
        });

        const geometry = new THREE.PlaneGeometry(VIDEO_ASPECT*FRUSTUM/2,
                                                 FRUSTUM/2);
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);

        if (!this.frameId) {
            this.frameId = window.requestAnimationFrame(this.animate);
            window.addEventListener('resize', this.onWindowResize);
        }
    }

    componentWillUnmount() {
        this.frameId && cancelAnimationFrame(this.frameId);
        this.frameId = null;
        window.removeEventListener('resize', this.onWindowResize);
    }

    render() {
        return cE(DailyVideo, null);
    }
}

module.exports = TalkingHead;
