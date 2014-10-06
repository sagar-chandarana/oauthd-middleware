
function init_oauthio() {
	OAuth.initialize(config.app);
	OAuth.setOAuthdURL(config.oauthd);
}

function authenticate(callback) {
	OAuth.popup('google', {
		// Google requires the following field 
		// to get a refresh token
		authorize: {
		    approval_prompt: 'force'
		}
	})
		.done(function(r) {
			$.ajax({
				url: config.oauth_middleware + '/oauth/signin',
				method: 'POST',
				data: {
				    app: config.app,
					  code: r.code,
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
  $.post(config.oauth_middleware + '/oauth/refresh', {appbase_token: data.credentials.appbase.access_token}).done(console.log.bind(console)).fail(console.log.bind(console))
}

function random() {
console.log('calling random.')
$.ajax({url: '/random', success: console.log.bind(console), error: console.error.bind(console)});
}

function go() {
	init_oauthio();
	authenticate(function(err, creds) {
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
}

$('#login_button').click(go);
