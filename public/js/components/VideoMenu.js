'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

class VideoMenu extends React.Component {

    constructor(props) {
        super(props);
        this.handleMenu = this.handleMenu.bind(this);
    }

    handleMenu(e) {
        AppActions.setLocalState(this.props.ctx, {showVideoModal: true});
    }

    render() {
        return cE('div', {className: 'fixed-bottom-left'},
                  cE(rB.Button, {bsSize: 'large',
                                 onClick: this.handleMenu},
                     cE(rB.Glyphicon, {glyph: 'cog'}))
                 );
    }
}

module.exports = VideoMenu;
