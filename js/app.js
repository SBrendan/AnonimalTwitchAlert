function loadCache() {
	$("#stream-name").html(config.name.charAt(0).toUpperCase() + config.name.slice(1));

	if (localStorage.stream_preview != null) {
		$("#stream-preview").attr("src", localStorage.stream_preview);
	}

	if (localStorage.stream_logo != null) {
		$("#stream-logo").attr("src", localStorage.stream_logo);
	}

	if (!localStorage.getItem("OAuth")) {
		getOAuthToken();
	} else {
		checkOauthToken();
	}

	$(".stream-link").attr("href", "https://www.twitch.tv/" + config.name);
}

function checkOauthToken() {
	var OAuthToken = JSON.parse(localStorage.getItem("OAuth"));
	var current_time = new Date().getTime() / 1000;
	if (current_time > OAuthToken.expires_at) {
		console.log("expire");
		getOAuthToken();
	}
}

function getOAuthToken() {
	$.ajax({
		type: "POST",
		dataType: "json",
		cache: false,
		url: "https://id.twitch.tv/oauth2/token?client_id=" +
			config.clientID +
			"&client_secret=" +
			config.secretID +
			"&grant_type=client_credentials",
		success: function (data) {
			if (data.access_token) {
				localStorage.setItem("OAuth", JSON.stringify(data));
			}
		},
	});
}

function offlineStream($userData) {
	$("#stream-viewers").html("-");
	$("#stream-game").html("-");
	$("#stream-title").html("...");
	$("#stream-status").html("Hors Ligne");
	$("#stream-status-point").removeClass("on");
	$("#stream-preview").attr("src", $userData[0].offline_image_url);

	chrome.browserAction.setBadgeText({
		text: ""
	});

	if (localStorage.stream_logo != null) {
		$("#stream-logo").attr("src", localStorage.stream_logo);
	}
}

function onlineStream($channelData, $userData) {
	var preview = $channelData[0].thumbnail_url.replace('{width}x{height}', '380x214');
	$("#stream-viewers").html($channelData[0].viewer_count);
	$("#stream-game").html($channelData[0].game_name);
	$("#stream-title").html($channelData[0].title);
	$("#stream-logo").attr("src", $userData[0].profile_image_url);
	$("#stream-preview").attr("src", preview);
	$("#stream-status").html("En Ligne");
	$("#stream-status-point").addClass("on");

	localStorage.stream_preview = preview;
	localStorage.stream_logo = $userData[0].profile_image_url;
}

function checkStream() {
	var OAuthToken = JSON.parse(localStorage.getItem("OAuth"));
	$.ajax({
		type: "GET",
		dataType: "json",
		cache: false,
		beforeSend: function (request) {
			request.setRequestHeader("Client-ID", config.clientID);
			request.setRequestHeader(
				"Authorization",
				"Bearer " + OAuthToken.access_token
			);
		},
		url: "https://api.twitch.tv/helix/streams?user_login=" + config.name,
		success: function (channelData) {
			$.ajax({
				type: "GET",
				dataType: "json",
				cache: false,
				beforeSend: function (request) {
					request.setRequestHeader("Client-ID", config.clientID);
					request.setRequestHeader(
						"Authorization",
						"Bearer " + OAuthToken.access_token
					);
				},
				url: "https://api.twitch.tv/helix/users?login=" + config.name,
				success: function (userData) {
					if (channelData.data.length > 0) {
						onlineStream(channelData.data, userData.data);
					} else {
						offlineStream(userData.data);
					}
				}
			})

		},
	});
}

loadCache();
checkStream();
setInterval(checkStream, 120000);