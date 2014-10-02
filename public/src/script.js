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
				    app: credentials.key,
					code: r.code,
					secret: credentials.secret,
					provider: 'google'
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

function retrieve_user_info(data, callback) {
	console.log('creds', data);
	var request = reqObj = OAuth.create('google', data.credentials.provider);
	callback(data)
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
					$('#name_box').html(user_data.firstname)
					$('#email_box').html(user_data.email);
					$('#img_box').attr('src', user_data.avatar);
				});
			} else {
				console.error(err)
			}
		});
	});
}

$('#login_button').click(go);
