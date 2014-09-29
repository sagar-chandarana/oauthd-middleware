function init_oauthio() {
	OAuth.initialize(credentials.key);
	OAuth.setOAuthdURL("http://localhost:6284");
}

function retrieve_token(callback) {
	$.ajax({
		url: '/oauth/token',
		success: function(data, status) {
			callback(null, data.token);
		},
		error: function(data) {
			callback(data);
		}
	});
}

function authenticate(token, callback) {
	OAuth.popup('google', {
		state: token,
		// Google requires the following field 
		// to get a refresh token
		authorize: {
		    approval_prompt: 'force'
		}
	})
		.done(function(r) {
			$.ajax({
				url: '/oauth/signin',
				method: 'POST',
				data: {
					code: r.code
				},
				success: function(data, status) {
					callback(null, data);
				},
				error: function(data) {
					callback(data);
				}
			});
		})
		.fail(function(e) {
			console.log(e);
		});
}

function retrieve_user_info(creds, callback) {
	console.log('creds', creds);
	var request = OAuth.create('google', creds);
	request.get('/plus/v1/people/me')
	.done( callback)
	.fail( console.error.bind(console));
}

function random() {
console.log('calling random.')
$.ajax({url: '/random', success: console.log.bind(console), error: console.error.bind(console)});
}

function go() {
	init_oauthio();
	retrieve_token(function(err, token) {
		authenticate(token, function(err, creds) {
			if (!err) {
				retrieve_user_info(creds, function(user_data) {
					$('#name_box').html(user_data.displayName)
					$('#email_box').html(user_data.emails[0].value);
					$('#img_box').attr('src', user_data.image.url);
				});
			} else {
				console.error(err)
			}
		});
	});
}

$('#login_button').click(go);
