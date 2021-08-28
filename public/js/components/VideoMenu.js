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
                  cE(rB.Button, {bsStyle: 'link', bsSize: 'large',
                                 onClick: this.handleMenu}, 'Settings')
                 );
    }
}

module.exports = VideoMenu;
