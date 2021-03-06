function init_oauthio() {
	OAuth.initialize(config.app);
	OAuth.setOAuthdURL(config.oauthd);
}

function authenticate(callback) {
	OAuth.popup(config.provider, {
		authorize: {
		    scope: ['openid email']
		}
	})
		.done(function(r) {
			console.log('from provider:', r);
			$.ajax({
				url: config.oauth_middleware + '/oauth/signin',
				method: 'POST',
				data: {
				    app: config.app,
					  code: r.code,
					  provider: config.provider
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
	var request = reqObj = OAuth.create(config.provider, data.credentials.provider);
	callback(data)
  $.post(config.oauth_middleware + '/oauth/refresh', {for_provider:true, for_appbase: true, appbase_token: data.credentials.appbase.access_token}).done(console.log.bind(console)).fail(console.log.bind(console))
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
