'use strict';

const cli = require('caf_cli');
const AppActions = require('../actions/AppActions');
const urlParser = require('url');

exports.connect = function(ctx) {
    return new Promise((resolve, reject) => {
        const myURL = urlParser.parse(window.location.href);
        if (myURL.hash.indexOf('session=default') > 0) {
            AppActions.setLocalState(ctx, {
                isPrimary: true, showVideoModal: true
            });
        } else {
            const userSession = 'session=user' + cli.randomString(8);
            myURL.hash = myURL.hash.replace('session=user', userSession);
        }
        const session = new cli.Session(urlParser.format(myURL));

        session.onopen = async function() {
            console.log('open session');
            try {
                resolve(await AppActions.init(ctx));
            } catch (err) {
                reject(err);
            }
        };

        session.onmessage = function(msg) {
            AppActions.message(ctx, msg);
        };

        session.onclose = function(err) {
            console.log('closing:' + JSON.stringify(err));
            AppActions.closing(ctx, err);
            err && reject(err); // no-op if session already opened
        };

        ctx.session = session;
    });
};
