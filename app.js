var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var crypto = require('crypto');

/* Requiring the lib */

var oauth = require('oauthio');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'keyboard dog',
    saveUninitialized: true, 
    resave: true
}	));

/* Initialization */
var oauth = require('oauthio');
oauth.setOAuthdUrl("http://localhost:6284", '/');

/* Endpoints */
app.get('/oauth/token', function (req, res) {
	var token = oauth.generateStateToken(req.session);

	res.json({
		token: token
	});
});

app.post('/oauth/signin', function (req, res) {
	var code = req.body.code;
	var app = req.body.app;
	var secret = req.body.secret;
	var provider = req.body.provider;
	//request.get(oauth.getOAuthdUrl() + 'api/apps/' + app, console.log.bind(console));
	oauth.auth(provider, req.session, {
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
			var algorithm = 'aes256';
			var key = 'ahLvnbEuNVtSH86';
			var tokenObj = {"appname": app, "g": Date.now(), "e": 24 * 3600 * 1000, "email": user_data.email}; //24 hours token
			var cipher = crypto.createCipher(algorithm, key);  
			var encryptedToken = cipher.update(JSON.stringify(tokenObj), 'utf8', 'hex') + cipher.final('hex');
			user_data.credentials =  {
				provider: {						
					access_token: creds.access_token,
					expires_in: creds.expires_in,
					token_type: creds.token_type,
					request: creds.request	
				},
				appbase: {
					access_token: encryptedToken,
					expires_in: tokenObj["e"]
				}
			}
			res.status(200).send(user_data);
		})
		.fail(function (e) {
			res.status(400).send(e);
		});
		
		
	})
	.fail(function (e) {
		console.log('signin', e);
		res.status(400).send(e);
	});
});

app.listen(process.env.NODEJS_PORT || 3000, function () {
	console.log('OAuth.io Tutorial server running on port ' + (process.env.NODEJS_PORT || 3000));
});
