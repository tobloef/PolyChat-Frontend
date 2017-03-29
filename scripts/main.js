const maxWritingBoxHeight = 150;
const writingBoxDefaultHeight = 37;
const nicknameMaxLength = 32;

const log = [];
const urls = {
    "node": "ws://tobloef.com/polychat/node:80",
    "go": "ws://tobloef.com/polychat/go:80",
    "elixir": "ws://tobloef.com/polychat/elixir:80"
};

let nickname;
let ws;
let ready = false;

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
	if (chooseNickname()) {
		connect();
	} else {
		addStatusMessage("You cannot connect to the server without a username.");
	}
});

function addMessage(message, nickname) {
	if (shouldPrintNickname(log, nickname)) {
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

function shouldPrintNickname(log, nickname) {
	if (log.length > 0) {
		if (log[log.length - 1].nickname !== nickname) {
			return true;
		}
	}
	if ($(".chat-log li").last().hasClass("status")) {
		return true;
	}
	return false;
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
		ws.send(JSON.stringify({type: "connect", data: nickname}));
	};
	ws.onclose = function(event) {
		if (ready) {
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
			case "connectResponse":
				switch (data.data) {
					case "nicknameTaken":
						if (chooseNickname("Nickname already taken. Pick a different one:")) {
							ws.send(JSON.stringify({type: "connect", data: nickname}));
						} else {
							addStatusMessage("You cannot connect to the server without a username.");
						}
						break;
					case "ready":
						ready = true;
						$(".writing-box").prop("disabled", false);
						break;
				}
				break;
		}
	};
}

function chooseNickname(message) {
	nickname = prompt(message || "Please choose a nickname:").replace(/\s\s+/g, " ");
	if (nickname == null || nickname === "") {
		chooseNickname();
		return false;
	} else if (nickname.length > nicknameMaxLength) {
		chooseNickname("Nickname cannot be above 32 characters, please choose a shorter one:");
		return false;
	}
	return true;
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
