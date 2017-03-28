const maxWritingBoxHeight = 150;
const writingBoxDefaultHeight = 37;

const log = [];

$(function() {
	$(".writing-box").on("input", function() {
		this.style.flex = `0 0 ${writingBoxDefaultHeight}px`;
		const newHeight = Math.min(this.scrollHeight, maxWritingBoxHeight);
		this.style.flex = `0 0 ${newHeight + 1}px`;
		this.scrollTop = this.scrollHeight;
	});
});

function addMessage(username, message) {
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
	if (log && log.length > 0) {
		return log[log.length - 1].username;
	}
}