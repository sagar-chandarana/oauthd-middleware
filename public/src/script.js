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
	.done( console.log.bind(console))
	.fail( console.log.bind(console));
}

function random() {
console.log('calling random.')
$.ajax({url: '/random', success: console.log.bind(console), error: console.log.bind(console)});
}

function go() {
	init_oauthio();
	retrieve_token(function(err, token) {
		authenticate(token, function(err, creds) {
			if (!err) {
				retrieve_user_info(creds, function(user_data) {
					$('#name_box').html(user_data.name)
					$('#email_box').html(user_data.email);
					$('#img_box').attr('src', user_data.avatar);
				});
			}
		});
	});
}

$('#login_button').click(go);
