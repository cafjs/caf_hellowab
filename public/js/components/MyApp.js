'use strict';

const React = require('react');
const rB = require('react-bootstrap');
const AppActions = require('../actions/AppActions');
const AppStatus = require('./AppStatus');
const DisplayError = require('./DisplayError');
const DisplayURL = require('./DisplayURL');
const Iframe = require('./Iframe');
const VideoModal = require('./VideoModal');
const VideoMenu = require('./VideoMenu');
const TalkingHead = require('./TalkingHead');

const cE = React.createElement;

class MyApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.props.ctx.store.getState();
    }

    componentDidMount() {
        if (!this.unsubscribe) {
            this.unsubscribe = this.props.ctx.store
                .subscribe(this._onChange.bind(this));
            this._onChange();
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    _onChange() {
        if (this.unsubscribe) {
            this.setState(this.props.ctx.store.getState());
        }
    }

    render() {
        return cE('div', {className: 'container-fluid iframe-div'},
                  cE(DisplayError, {
                      ctx: this.props.ctx,
                      error: this.state.error
                  }),
                  cE(DisplayURL, {
                      ctx: this.props.ctx,
                      invite: this.state.invite
                  }),
                  cE(VideoModal, {
                      ctx: this.props.ctx,
                      showVideoModal: this.state.showVideoModal,
                      isKeyAPI: this.state.isKeyAPI,
                      status: this.state.status,
                      activeRoomExpires: this.state.activeRoomExpires
                  }),
                  cE(Iframe, {
                      ctx: this.props.ctx,
                      wab: this.state.wab
                  }),
                  cE(VideoMenu, {
                      ctx: this.props.ctx
                  }),
                  cE(TalkingHead, {
                      ctx: this.props.ctx
                  })
                 );
    }
};

module.exports = MyApp;
