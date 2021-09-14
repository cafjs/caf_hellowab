const React = require('react');
const rB = require('react-bootstrap');
const cE = React.createElement;
const cli = require('caf_cli');
const json_rpc = require('caf_transport').json_rpc;
const DEFAULT_URL = 'blank.html';
const urlParser = require('url');


class Iframe extends React.Component {

    constructor(props) {
        super(props);
        this.computeURL = this.computeURL.bind(this);
        this.state = {
            version: 1
        };
    }

    componentDidUpdate(prevProps) {
        let needUpdate = (prevProps.wab && !this.props.wab) ||
            (!prevProps.wab && this.props.wab);

        if (prevProps.wab && this.props.wab) {
            needUpdate = (prevProps.wab.app !== this.props.wab.app) ||
                (prevProps.wab.token !== this.props.wab.token);
        }

        if (needUpdate) {
            this.setState({version: this.state.version + 1});
        }
    }

    computeURL() {
        const {app, token} = this.props.wab || {};
        if (app && token) {
            const split = json_rpc.splitName(app, json_rpc.APP_SEPARATOR);
            const [appPublisher, appLocalName] = json_rpc.splitName(split[0]);
            const [caOwner, caLocalName] = json_rpc.splitName(split[1]);

            const options = {
                appPublisher,
                appLocalName,
                caOwner,
                caLocalName,
                token
            };

            const pURL = cli.patchURL(window.location.href, options);
            const myURL = urlParser.parse(pURL);
            const userSession = 'session=user';
            if (myURL.pathname.indexOf('/user/') < 0) {
                myURL.pathname = '/user' + myURL.pathname;
            }
            myURL.hash = myURL.hash.replace('session=default', 'session=user');
            if (this.props.isPrimary) {
                myURL.hash =  myURL.hash + '&isPrimary=true';
            }

            delete myURL.search; // no cacheKey
            // force reload when only the fragment changes
            myURL.search = `?dummyVersion=${this.state.version}`;
            return urlParser.format(myURL);
        } else {
            return DEFAULT_URL;
        }
    };

    render() {
        const targetURL = this.computeURL();
        return cE('iframe', {
            id: 'page-wrap',
            // disable top-navigation
            sandbox:'allow-same-origin allow-popups allow-scripts allow-forms allow-pointer-lock allow-modals',
            className: 'iframe-fit',
            frameBorder: 0,
            src: targetURL
        }, null);
    }
}

module.exports = Iframe;
