const maxWritingBoxHeight = 150;
const writingBoxDefaultHeight = 37;

const log = [];
let username;

$(function() {
	$(".writing-box").on("input", autoResize);
	$(".writing-box").on("keypress", function(event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			if ($(this).val() !== "") {
				submitMessage($(this).val(), username);
				$(this).val("");
			}
			$(this).trigger("input");
		}
	});
	$(".backend-selector").on("change", function() {
		disconnect();
		connect();
	});

	username = chooseUsername();
	connect();
});

function addMessage(message, username) {
	if (getLatestChatter() !== username) {
		$("<li />", {
			"class": "username",
			text: username
		}).appendTo(".chat-log");
	}
	$("<li />", {
		"class": "message",
		text: message
	}).appendTo(".chat-log");
	log.push({username, message});
}

function getLatestChatter() {
	if (log.length > 0) {
		return log[log.length - 1].username;
	}
}

function autoResize() {
	this.style.flex = `0 0 ${writingBoxDefaultHeight}px`;
	const newHeight = Math.min(this.scrollHeight, maxWritingBoxHeight);
	this.style.flex = `0 0 ${newHeight + 1}px`;
	this.scrollTop = this.scrollHeight;
}

function disconnect() {
	// Todo: Disconnect from all backends.
}

function connect() {
	switch ($(".backend-selector").val()) {
	    default:
	    case "node":
	        connectNode();
	        break;
	    case "go":
	        connectGo();
	        break;
	    case "elixir":
	        connectElixir();
	        break;
	}
}

function connectNode() {
	alert("Sorry, the backend you were trying to connect to hasn't been implemented yet.");
}

function connectGo() {
	alert("Sorry, the backend you were trying to connect to hasn't been implemented yet.");
}

function connectElixir() {
	alert("Sorry, the backend you were trying to connect to hasn't been implemented yet.");
}

function submitMessage(message, username) {
	if (message && username) {
		addMessage(message, username);
	}
}

function chooseUsername() {
	const username = prompt("Please choose a username:");
	if (username) {
		return username;
	}
	return chooseUsername();
}