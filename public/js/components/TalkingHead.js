'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');
const THREE = require('three');

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
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    animate() {
        /* VideoTexture should set needsUpdate...
        if (this.texture) {
            this.texture.needsUpdate = true;
        }
        */
        this.renderer.render(this.scene, this.camera);
        this.frameId = window.requestAnimationFrame(this.animate);
    }

    componentDidMount() {
        const canvas = document.getElementById('canvas-head');
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            premultipliedAlpha: false
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.z = 5;

        this.scene = new THREE.Scene();
        this.scene.background = null; // Do I need this?

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

        const geometry = new THREE.PlaneGeometry(16, 9);
        const mesh = new THREE.Mesh(geometry, material);
//        geometry.scale(0.4, 0.5, 0.5);
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
        return cE('div', null);/*cE('video', {className: 'fixed-bottom-right', display: 'none',
                            ref: (videoRef) => this.videoRef = videoRef,
                            width: '50%',  height: 'auto', id: 'video-head',
                            autoPlay: true,  loop: true,  muted: true},
                  cE('source', {src: "171003D_002_2K.mp4",
                                type: 'video/mp4'})
                 );*/
    }
}

module.exports = TalkingHead;
