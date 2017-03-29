const maxWritingBoxHeight = 150;
const writingBoxDefaultHeight = 37;
const nicknameMaxLength = 32;

const log = [];
const urls = {
    "node": "ws://tobloef.com/polychat/node:3001",
    "go": "ws://tobloef.com/polychat/go:3001",
    "elixir": "ws://tobloef.com/polychat/elixir:3001"
}

let nickname;
let ws;
let hasBeenConnected = false;

$(function() {
	$(".writing-box").on("input", autoResize);
	$(".writing-box").on("keypress", function(event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			const message = $.trim($(this).val());
			if (message !== "") {
				if (message && nickname) {
					addMessage(message, nickname);
					sendMessage(message, nickname);
				}
				$(this).val("");
			}
			$(this).trigger("input");
		}
	});
	$(".backend-selector select").on("change", function() {
		disconnect();
		connect();
	});
	chooseNickname();
	connect();
});

function addMessage(message, nickname) {
	if (getLatestChatter() !== nickname) {
		$("<li />", {
			"class": "nickname",
			text: nickname
		}).appendTo(".chat-log");
	}
	$("<li />", {
		"class": "message",
		text: message
	}).appendTo(".chat-log");
	log.push({
		nickname,
		message
	});
}

function getLatestChatter() {
	if (log.length > 0) {
		return log[log.length - 1].nickname;
	}
	return null;
}

function autoResize() {
	this.style.flex = `0 0 ${writingBoxDefaultHeight}px`;
	const newHeight = Math.min(this.scrollHeight, maxWritingBoxHeight);
	this.style.flex = `0 0 ${newHeight + 1}px`;
	this.scrollTop = this.scrollHeight;
}

function disconnect() {
	if (ws) {
		ws.close();
	}
}

function connect() {
	if (!WebSocket) {
		addStatusMessage("Your browser doesn't support WebSockets and you won't be able to use the application. Please upgrade to a newer browser.");
		return;
	}
	const backend = $(".backend-selector select").val();
	if (backend == "go" || backend == "elixir") {
		addStatusMessage("Sorry, the backend you were trying to connect to hasn't been implemented yet.");
		return;
	}
	url = urls[backend];
	try {
		ws = new WebSocket(url);
	} catch (exception) {
		addStatusMessage("Couldn't connect to the server. The server may be down.");
		console.error(exception);
	}
	ws.onopen = function(event) {
		ws.send(JSON.stringify({type: "connected", data: nickname}), function(error) {
			if (!error) {
				hasBeenConnected = true;
			}
		});
	};
	ws.onclose = function(event) {
		if (hasBeenConnected) {
			addStatusMessage("Lost connection to server. Try refreshing the page.");
		} else {
			addStatusMessage("Couldn't connect to the server. The server may be down.");
		}
	};
	ws.onmessage = function(event) {
		const data = JSON.parse(event.data);
		switch (data.type) {
			case "message":
				addMessage(data.data.message, data.data.nickname);
				break;
			case "onlineCount":
				setOnlineCount(data.data);
				break;
			case "connected":
				addStatusMessage(`${data.data} joined`);
				break;
			case "disconnected":
				addStatusMessage(`${data.data} left`);
				break;
		}
	};
}

function chooseNickname() {
	while (true) {
		if (nickname == null || nickname == "") {
			nickname = prompt("Please choose a nickname:").replace(/\s\s+/g, " ");
		} else if (nickname.length > nicknameMaxLength) {
			nickname = prompt("Nickname cannot be above 32 characters, please choose a shorter one:").replace(/\s\s+/g, " ");
		} else {
			return;
		}
	}
}

function sendMessage(message, nickname) {
	if (ws) {
		ws.send(JSON.stringify({type: "message", data: {message, nickname}}));
	}
}

function setOnlineCount(onlineCount) {
	$(".online-count-number").text(onlineCount);
}

function addStatusMessage(message) {
	$("<li />", {
		"class": "status",
		text: message
	}).appendTo(".chat-log");
}
