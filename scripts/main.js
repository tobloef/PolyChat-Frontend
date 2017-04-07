const maxWritingBoxHeight = 150;
const writingBoxDefaultHeight = 37;
const nicknameMaxLength = 32;

const log = [];

let nickname;
let ws;
let ready = false;

$(function() {
	$(".writing-box").on("input", autoResize);
	$(".writing-box").on("keypress", onKeypress);
	$(".backend-selector select").on("change", function() {
		disconnect();
		connect();
	});
	getMessages();
	if (chooseNickname()) {
		connect();
	} else {
		addStatusMessage("You cannot connect to the server without a username.");
	}
});

// Handler method for the keypress event.
function onKeypress(event) {
	// When enter is pressed, send the message.
	if (event.which === 13 && !event.shiftKey) {
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
}

// Add a message to the chat log with nickname if needed.
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

// Determine wheher the nickname of the sender should be added
// above their message in the chat log.
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

// Automatically resize the text area for writing the message.
function autoResize() {
	this.style.flex = `0 0 ${writingBoxDefaultHeight}px`;
	const newHeight = Math.min(this.scrollHeight, maxWritingBoxHeight);
	this.style.flex = `0 0 ${newHeight + 1}px`;
	this.scrollTop = this.scrollHeight;
}

// Disconnect the user from the chat.
function disconnect() {
	if (ws) {
		ws.close();
	}
}

// Try to connect to the WebSocket server of the specified backend.
// Also set up event listeners for the WebSocket.
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
	const backendText = $(".backend-selector select option:selected").text();
	addStatusMessage(`Connecting to the ${backendText} backend...`);
	url = `ws://tobloef.com/polychat/${backend}/:80`;
	try {
		ws = new WebSocket(url);
	} catch (exception) {
		addStatusMessage("Couldn't connect to the server. The server may be down.");
		console.error(exception);
	}
	// When the connection has been opened.
	ws.onopen = function(event) {
		ws.send(JSON.stringify({
			type: "connect",
			data: {
				nickname
			}
		}));
	};
	// When the connection closes for any reason.
	ws.onclose = function(event) {
		if (ready) {
			addStatusMessage("Lost connection to server. Try choosing another backend or refreshing the page.");
		} else {
			addStatusMessage("Couldn't connect to the server. The backend you tried to connect to may be down.");
		}
		setOnlineCount("");
	};
	// When the WebSocket client recieves a message from the server.
	ws.onmessage = function(message) {
		const event = JSON.parse(message.data);
		switch (event.type) {
			case "message":
				addMessage(event.data.message, event.data.nickname);
				break;
			case "onlineCount":
				setOnlineCount(event.data);
				break;
			case "connected":
				addStatusMessage(`${event.data.nickname} joined`);
				break;
			case "disconnected":
				addStatusMessage(`${event.data.nickname} left`);
				break;
			case "connectResponse":
				handleConnectResponse(event.data);
				break;
		}
	};
}

// Prompt the user to choose a nickname.
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

// Handle the response from the server specifiing if the user got connected.
function handleConnectResponse(response) {
	switch (response) {
    	case "nicknameTaken":
        	if (chooseNickname("Nickname already taken. Pick a different one:")) {
            	ws.send(JSON.stringify({
                	type: "connect",
                    data: {
                    	nickname
                  	}
				}));
			} else {
            	addStatusMessage("You cannot connect to the server without a username.");
            }
            break;
		case "ready":
        	ready = true;
            $(".writing-box").prop("disabled", false);
            break;
	}
}

// Send a chat message to the server.
function sendMessage(message, nickname) {
	if (ws) {
		ws.send(JSON.stringify({
			type: "message",
			data: {
				message,
				nickname
			}
		}));
	}
}

// Set the "Online users" count to the specified number.
function setOnlineCount(onlineCount) {
	$(".online-count-number").text(onlineCount);
}

// Add a status message to the chat log.
function addStatusMessage(message) {
	$("<li />", {
		"class": "status",
		text: message
	}).appendTo(".chat-log");
}

// Get previous chat messages from the server and add them to the log.
function getMessages() {
	const backend = $(".backend-selector select").val();
	$.get(`http://tobloef.com/polychat/${backend}/api/messages`, function(data) {
		if (!data && data.length > 0) {
			return;
		}
		for (let i = 0; i < data.length; i++) {
			addMessage(data[i].message, data[i].username);
		}
	});
}
