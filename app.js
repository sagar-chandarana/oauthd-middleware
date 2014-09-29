var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');

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
    secret: 'keyboard cat',
    saveUninitialized: true, 
    resave: true
}	));

/* Initialization */
var oauth = require('oauthio');
oauth.setOAuthdUrl("http://localhost:6284", '/');
oauth.initialize('70498cfce63946eea646e98e3d6a7644', '70498cfce63946eea646e98e3d6a7644');

/* Endpoints */
app.get('/oauth/token', function (req, res) {
	var token = oauth.generateStateToken(req.session);

	res.json({
		token: token
	});
});

app.post('/oauth/signin', function (req, res) {
	var code = req.body.code;
	console.log('signing in:', req.session);
	oauth.auth('google', req.session, {
		code: code
	})
	.then(function (request_object) {
		// Here the user is authenticated, and the access token 
		// for the requested provider is stored in the session.
		// Continue the tutorial or checkout the step-4 to get
		// the code for the request
		
		//TODO: give only a few things
		res.status(200).send(request_object.getCredentials());
	})
	.fail(function (e) {
		console.log('signin', e);
		res.status(400).send(e);
	});
});

app.get('/random', function(req, res) {
	console.log('random:', req.session);
	res.status(200).send('haha');
});

app.get('/me', function (req, res) {
	// Here we first build a request object from the session with the auth method.
	// Then we perform a request using the .me() method.
	// This retrieves a unified object representing the authenticated user.
	// You could also use .get('/plus/v1/people/me') and map the results to fields usable from
	// the front-end (which waits for the fields 'name', 'email' and 'avatar').
	console.log('fetching me:', req.session);
	oauth.auth('google', req.session)
	.then(function (request_object) {
		return request_object.get('/plus/v1/people/me');
	})
	.then(function (user_data) {
		res.json(user_data);
	})
	.fail(function (e) {
		console.log('me', e);
		res.status(400).send(e);
	});
});

app.listen(process.env.NODEJS_PORT || 3000, function () {
	console.log('OAuth.io Tutorial server running on port ' + (process.env.NODEJS_PORT || 3000));
});
