'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');

class VideoMenu extends React.Component {

    constructor(props) {
        super(props);
        this.handleMenu = this.handleMenu.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
    }

    handleMenu(e) {
        AppActions.setLocalState(this.props.ctx, {showVideoModal: true});
    }

    handleBlur(e) {
        AppActions.setBlur(this.props.ctx, !this.props.blur);
    }

    render() {
        return cE('div', {className: 'fixed-bottom-left'},
                  cE(rB.ButtonGroup, null,
                     [
                         cE(rB.Button, {bsSize: 'large', key: 34,
                                        onClick: this.handleMenu},
                            cE(rB.Glyphicon, {glyph: 'cog'})),
                         (this.props.isPrimary ?
                          cE(rB.Button, {bsSize: 'large', key:21,
                                         onClick: this.handleBlur},
                             (this.props.blur ?
                              cE(rB.Glyphicon, {glyph: 'eye-close'}) :
                              cE(rB.Glyphicon, {glyph: 'eye-open'})
                             )
                            ) :
                          null)
                     ].filter(x => !!x)
                    )
                 );
    }
}

module.exports = VideoMenu;
