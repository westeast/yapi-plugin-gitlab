const request = require('request');
const controller = require('./controller/oauth2Controller');
const gitlabController = require('./controller/gitlabController');
const yapi = require('yapi.js');

module.exports = function (options) {
    const {emailPostfix, emailKey, userKey, host, loginPath, redirectUri} = options;

    this.bindHook('third_login', (ctx) => {
        let token = ctx.request.body.token || ctx.request.query.token;
        return new Promise((resolve, reject) => {
            request(host + loginPath + "?access_token=" + token, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let result = JSON.parse(body);
                    if (result) {
                        let ret = {
                            email: (emailKey != undefined && emailKey.length > 0) ? result[emailKey] : (result[userKey] + emailPostfix),
                            username: result[userKey]
                        };
                        resolve(ret);
                    } else {
                        reject(result);
                    }
                }
                reject(error);
            });
        });
    });

    this.bindHook('add_router', function(addRouter) {

        let path = redirectUri.split('/api/plugin/');
        if (!path[1]) {
            throw new Error("oauth redirectUri must like 'http://domain.com:port/api/plugin/xxxxx'");
        }
        addRouter({
            controller: controller,
            method: 'get',
            path: path[1],
            action: 'oauth2Callback'
        });

        addRouter({
            controller: gitlabController,
            method: 'post',
            path: 'gitlab/project',
            action: 'addProject'
        });

        addRouter({
            controller: gitlabController,
            method: 'post',
            path: 'gitlab/asyncGroup',
            action: 'asyncGroup'
        })
    });
}