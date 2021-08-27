const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const AppActions = require('../actions/AppActions');


class VideoModal extends React.Component {

    constructor(props) {
        super(props);
        this.doDismiss = this.doDismiss.bind(this);
    }


    doDismiss(ev) {
        AppActions.setLocalState(this.props.ctx, {showVideoModal: false});
    }

    render() {
        return cE(rB.Modal, {show: this.props.showVideoModal,
                             onHide: this.doDismiss,
                             animation: false},
                  cE(rB.Modal.Header, {
                      className : 'bg-primary text-primary',
                      closeButton: true
                  }, cE(rB.Modal.Title, null, 'Change Video Settings')),
                  cE(rB.Modal.Body, null,
                     cE(rB.Form, {horizontal: true},
/*
                        cE(rB.FormGroup, {controlId: 'appPubId'},
                           cE(rB.Col, {sm: 6, xs: 12},
                              cE(rB.ControlLabel, null, 'App Publisher')
                             ),
                           cE(rB.Col, {sm: 6, xs: 12},
                              cE(rB.FormControl, {
                                  type: 'text',
                                  readOnly: true,
                                  value: (this.props.login &&
                                          this.props.login.caOwner) || ''
                              })
                             )
                          ),
*/
                       )
                    ),
                  cE(rB.Modal.Footer, null,
                     cE(rB.Button, {onClick: this.doDismiss}, 'Dismiss')
                    )
                 );
    }
}

module.exports = VideoModal;
