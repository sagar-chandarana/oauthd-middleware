var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var cors = require('cors');
var redisC = require("redis").createClient();
var uuid = function (){
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
var crypt = {
	algorithm: 'aes256', 
	key: 'ahLvnbEuNVtSH86',
	encrypt: function(tokenObj) {
		var cipher = crypto.createCipher(crypt.algorithm, crypt.key);  
		return cipher.update(JSON.stringify(tokenObj), 'utf8', 'hex') + cipher.final('hex');
	},
	decrypt: function(encrypted) {	
		var decipher = crypto.createDecipher(crypt.algorithm, crypt.key);
		try {
			return JSON.parse(decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8'));	
		} catch(e) {
			return null;
		}
	}
}

var stateStore = {
	get: function(key, cb) {
		redisC.get('stateMiddleware:'+ key, cb);
	},
	set: function(key, ttl, val, cb) {
		redisC.setex('stateMiddleware:'+ key, ttl/1000, val, cb);
	}
}

var oauth = require('oauthio');

var app = express();
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/* Initialization */
var oauth = require('oauthio');
oauth.setOAuthdUrl("http://localhost:6284", '/');

var getSecret = 

/* Endpoints */
app.post('/oauth/signin', function (req, res) {
	var code = req.body.code;
	var app = req.body.app;
	var provider = req.body.provider;
	var state = {};
	state.provider = provider;
	request.get(oauth.getOAuthdUrl() + '/api/apps/' + app, function(error, responseFromOauthd) {
	    if(error) {
			res.status(400).send(responseFromOauthd? responseFromOauthd.body: e);
	    }
		var secret = JSON.parse(responseFromOauthd.body).data.secret;
		oauth.auth(provider, state, {
			code: code,
			public_key: app,
			secret_key: secret
		})
		.then(function (request_object) {
			// Here the user is authenticated, and the access token 
			// for the requested provider is stored in the session.
			// Continue the tutorial or checkout the step-4 to get
			// the code for the request
		
			request_object.me()
			.then(function (user_data) {
				var creds = request_object.getCredentials(); 
				var tokenObj = {"a": app, "g": Date.now(), "e": 24 * 3600 * 1000, "email": user_data.email, 'uuid': uuid()}; //24 hours token
				var encryptedToken = crypt.encrypt(tokenObj);
				user_data.credentials =  {
					provider: {
						provider: provider,
						access_token: creds.access_token,
						oauth_token: creds.oauth_token,
						oauth_token_secret: creds.oauth_token_secret, 
						expires_in: creds.expires_in,
						token_type: creds.token_type,
						request: creds.request	
					},
					appbase: {
						access_token: encryptedToken,
						expires_in: tokenObj["e"]/1000
					}
				}
				stateStore.set(tokenObj.uuid, tokenObj.e, JSON.stringify(state));
				res.status(200).send(user_data);
			})
			.fail(function (e) {
				res.status(500).send(e);
			});
		})
		.fail(function (e) {
			res.status(500).send(e);
		});
	});
});

app.post('/oauth/refresh', function(req, res) {
	var tokenObj = crypt.decrypt(req.body.appbase_token);
	if(tokenObj && (tokenObj.g + tokenObj.e >= Date.now())) {
		var credentials = {};
		if(req.body.for_appbase) {
			tokenObj.g = Date.now();
			credentials.appbase = {
				access_token: crypt.encrypt(tokenObj),
				expires_in: tokenObj["e"]/1000
			};
		}
		if(req.body.for_provider) {
			stateStore.get(tokenObj.uuid, function(error, state) {
				try {
					state = JSON.parse(state);
					if(!state) {
						res.status(500).send("Error retriving provider token.");
					}
					request.get(oauth.getOAuthdUrl() + '/api/apps/' + tokenObj.a, function(error, responseFromOauthd) {
					    if(error) {
							res.status(400).send(responseFromOauthd? responseFromOauthd.body: e);
					    }
						var secret = JSON.parse(responseFromOauthd.body).data.secret;
						oauth.auth(state.provider, state, {
							public_key: tokenObj.a,
							secret_key: secret,
							force_refresh: true
						})
						.then(function (request_object) {
							// Here the user is authenticated, and the access token 
							// for the requested provider is stored in the session.
							// Continue the tutorial or checkout the step-4 to get
							// the code for the request
							var creds = request_object.getCredentials();
							var encryptedToken = crypt.encrypt(tokenObj);
							credentials.provider = {
								provider: state.provider,
								access_token: creds.access_token,
								oauth_token: creds.oauth_token,
								oauth_token_secret: creds.oauth_token_secret, 
								expires_in: creds.expires_in,
								token_type: creds.token_type,
								request: creds.request	
							}

							stateStore.set(tokenObj.uuid, tokenObj.e, JSON.stringify(state));
							res.json(credentials);
						})
						.fail(function (e) {
							res.status(500).send(e);
						});
					});
				} catch(e) {
					res.status(500).send("Error retriving provider token:" + e);
				}
			})
		} else {
			res.json(credentials);
		}
	} else {
		res.status(400).send('Invalid or expired appbase_token');
	}
})

app.listen(process.env.NODEJS_PORT || 3000, function () {
	console.log('OAuth.io Tutorial server running on port ' + (process.env.NODEJS_PORT || 3000));
});
