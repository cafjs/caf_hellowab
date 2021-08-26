'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;

class Example extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return cE(rB.Form, {horizontal: true},
                  cE(rB.FormGroup, {controlId: 'counterId', bsSize: 'large'},
                     cE(rB.Col, {sm:2, xs: 12},
                        cE(rB.ControlLabel, null, 'App')
                       ),
                      cE(rB.Col, {sm:4, xs: 12},
                         cE(rB.FormControl, {
                             type: 'text',
                             readOnly: true,
                             value: this.props.wab && this.props.wab.app
                         })
                        )
                    ),
                  cE(rB.FormGroup, {controlId: 'tokId', bsSize: 'large'},
                     cE(rB.Col, {sm:2, xs: 12},
                        cE(rB.ControlLabel, null, 'Token')
                       ),
                      cE(rB.Col, {sm:4, xs: 12},
                         cE(rB.FormControl, {
                             type: 'text',
                             readOnly: true,
                             value: this.props.wab && this.props.wab.token
                         })
                        )
                    )
                 );
    }
}

module.exports = Example;
