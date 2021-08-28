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
    }


    render() {
        return cE('div', {className: 'fixed-bottom-right'},
                  cE('video', {width: 320,  height: 'auto', id: 'video-head',
                               autoPlay: true,  loop: true,  muted: true},
                     cE('source', {src: "171003D_002_2K.mp4",
                                   type: 'video/mp4'})
                    )
                 );
    }
}

module.exports = TalkingHead;
