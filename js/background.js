var alreadyCheck = false;
var audio = new Audio("sounds/pull-out.ogg");

function pushNotification(id, title, message, iconUrl) {

	chrome.notifications.create(id, {
		type: "basic",
		title: title,
		message: message,
		iconUrl: iconUrl
	});

	chrome.notifications.onClicked.addListener(function (notifId) {
		chrome.tabs.create({
			url: "https://www.twitch.tv/" + config.name
		});
	})
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

function checkStream() {
	var OAuthToken = JSON.parse(localStorage.getItem("OAuth"));

	if (!localStorage.getItem("OAuth")) {
		getOAuthToken();
	} else {
		checkOauthToken();
	}

	$.ajax({
		type: "GET",
		dataType: "json",
		cache: false,
		url: "https://api.twitch.tv/helix/streams?user_login=" + config.name,
		beforeSend: function (request) {
			request.setRequestHeader("Client-ID", config.clientID);
			request.setRequestHeader(
				"Authorization",
				"Bearer " + OAuthToken.access_token
			);
		},
		success: function (streamData) {
			if (streamData.data.length > 0) {
				chrome.browserAction.setBadgeText({
					text: "LIVE"
				});
				chrome.browserAction.setBadgeBackgroundColor({
					color: config.default_color
				});

				chrome.browserAction.setTitle({
					title: config.name.charAt(0).toUpperCase() + config.name.slice(1) + " - En ligne"
				});

				if (!alreadyCheck) {
					pushNotification(config.name, "Salut, Je suis en ligne - " + streamData.data[0].title, "Je stream " + streamData.data[0].game_name + ", rejoignez moi sur Twitch.", "img/icon_128.png");
					audio.play();
					alreadyCheck = true;
				}

			} else {
				chrome.browserAction.setBadgeText({
					text: ""
				});
				chrome.browserAction.setTitle({
					title: config.name.charAt(0).toUpperCase() + config.name.slice(1) + " - Hors ligne"
				});
			}
		}
	});
}

checkStream();
setInterval(checkStream, 120000);