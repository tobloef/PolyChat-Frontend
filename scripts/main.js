const maxWritingBoxHeight = 150;
const writingBoxDefaultHeight = 37;

$(function() {
	$(".writing-box").on("input", function() {
		this.style.flex = `0 0 ${writingBoxDefaultHeight}px`;
		const newHeight = Math.min(this.scrollHeight, maxWritingBoxHeight);
		this.style.flex = `0 0 ${newHeight + 1}px`;
		this.scrollTop = this.scrollHeight;
	});
});