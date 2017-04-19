const maxWritingBoxHeight = 150;
const writingBoxDefaultHeight = 37;
const nicknameMaxLength = 32;
const ports = {
	node: "3000",
	go: "3001",
	elixir: "3002"
};
const debug = false;

let nickname;
let ws;
let ready = false;
let lastSender = null;

$(function() {
	$(".writing-box").on("input", autoResize);
	$(".writing-box").on("keypress", onKeypress);
	$(".backend-selector select").on("change", function() {
		disconnect();
		clearChatLog();
		getMessages();
		connect();
	});
	getMessages();
	connect();
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
	const $chatLog = $(".chat-log");
	const $chatContainer = $(".chat-container");
	const isScrolledToBottom = $chatContainer[0].scrollHeight - $chatContainer.height() <= $chatContainer.scrollTop() + 1;
	if (shouldPrintNickname(nickname)) {
		$("<li />", {
			"class": "nickname",
			text: nickname
		}).appendTo(".chat-log");
	}
	$("<li />", {
		"class": "message",
		text: message
	}).appendTo(".chat-log");
	lastSender = nickname;
	if (isScrolledToBottom) {
		$chatContainer.scrollTop($chatContainer.prop("scrollHeight"));
    }
}

// Determine wheher the nickname of the sender should be added
// above their message in the chat log.
function shouldPrintNickname(nickname) {
	return lastSender == null || lastSender != nickname;
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
	if (nickname == null && !chooseNickname()) {
		addStatusMessage("You cannot connect to the server without a username.");
		return;
    }
	if (!WebSocket) {
		addStatusMessage("Your browser doesn't support WebSockets and you won't be able to use the application. Please upgrade to a newer browser.");
		return;
	}
	const backend = $(".backend-selector select").val();
	if (backend == "elixir") {
		addStatusMessage("Sorry, the backend you were trying to connect to hasn't been implemented yet.");
		return;
	}
	const backendText = $(".backend-selector select option:selected").text();
	addStatusMessage(`Connecting to the ${backendText} backend...`);
	let url;
	if (debug) {
		url = `ws://localhost:${ports[backend]}`;
	} else {
		url = `ws://tobloef.com/polychat/${backend}/:80`;
	}
	try {
		ws = new WebSocket(url);
	} catch (exception) {
		addStatusMessage("Couldn't connect to the server. The server may be down.");
		console.error(exception);
		return;
	}
	// When the connection has been opened.
	ws.onopen = function(event) {
		ws.send(JSON.stringify({
			type: "connect",
			data: nickname
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
				addMessage(event.data.content, event.data.nickname);
				break;
			case "onlineCount":
				setOnlineCount(event.data);
				break;
			case "connected":
				addStatusMessage(`${event.data} joined`);
				break;
			case "disconnected":
				addStatusMessage(`${event.data} left`);
				break;
			case "connectResponse":
				handleConnectResponse(event.data);
				break;
		}
	};
}

// Prompt the user to choose a nickname.
function chooseNickname(message) {
	const newNickname = (prompt(message || "Please choose a nickname:") || "" ).replace(/\s\s+/g, " ");
	if (newNickname == null || newNickname === "") {
		return chooseNickname();
	} else if (newNickname.length > nicknameMaxLength) {
		chooseNickname("Nickname cannot be above 32 characters, please choose a shorter one:");
		return false;
	}
	nickname = newNickname;
	return true;
}

// Handle the response from the server specifiing if the user got connected.
function handleConnectResponse(response) {
	switch (response) {
    	case "nicknameTaken":
        	if (chooseNickname("Nickname already taken. Pick a different one:")) {
            	ws.send(JSON.stringify({
                	type: "connect",
                    data: nickname
				}));
			} else {
            	addStatusMessage("You cannot connect to the server without a username.");
            }
            break;
		case "ready":
        	ready = true;
			addStatusMessage("Successfully connected to the server. You can now begin chatting.");
            $(".writing-box").prop("disabled", false);
            break;
		case "error":
			addStatusMessage("Sorry, something has gone wrong. Try again later.");
			break;
	}
}

// Send a chat message to the server.
function sendMessage(message, nickname) {
	if (ws) {
		ws.send(JSON.stringify({
			type: "message",
			data: message,
		}));
	}
}

// Set the "Online users" count to the specified number.
function setOnlineCount(onlineCount) {
	$(".online-count-number").text(onlineCount);
}

// Add a status message to the chat log.
function addStatusMessage(message) {
	const $chatLog = $(".chat-log");
	const $chatContainer = $(".chat-container");
	const isScrolledToBottom = $chatContainer[0].scrollHeight - $chatContainer.height() <= $chatContainer.scrollTop() + 1;
	$("<li />", {
        "class": "status",
        text: message
    }).appendTo(".chat-log");
    lastSender = null;
    if (isScrolledToBottom) {
        $chatContainer.scrollTop($chatContainer.prop("scrollHeight"));
    }
}

function clearChatLog() {
	$(".chat-log").empty()
}

// Get previous chat messages from the server and add them to the log.
function getMessages() {
	const backend = $(".backend-selector select").val();
	let url;
    if (debug) {
        url = `http://localhost:${ports[backend]}/api/messages`;
    } else {
        url = `http://tobloef.com/polychat/${backend}/api/messages`;
    }
	$.get(url, function(data) {
		if (!data && data.length > 0) {
			return;
		}
		for (let i = 0; i < data.length; i++) {
			addMessage(data[i].content, data[i].nickname);
		}
	});
}
