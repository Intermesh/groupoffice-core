import {expect} from "chai";
import {describe} from "mocha";
import {Markdown} from "../../script/util/Markdown.js";

describe('Markdown class', () => {

	describe("toHtml", () => {
		it('Renders markdown', () => {
			const html = Markdown.toHtml("# Title\n\n**bold** and [link](https://example.com)");

			expect(html).to.contain("<h1>Title</h1>");
			expect(html).to.contain("<strong>bold</strong>");
			expect(html).to.contain('<a href="https://example.com">link</a>');
		});

		it('Turns single line breaks into <br>', () => {
			expect(Markdown.toHtml("line 1\nline 2")).to.contain("<br>");
		});

		it('Removes scripts and event handlers from raw HTML', () => {
			const html = Markdown.toHtml('text <script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">x</a>');

			expect(html).to.not.contain("<script");
			expect(html).to.not.contain("onerror");
			expect(html).to.not.contain("javascript:");
		});

		it('Removes style blocks and form controls', () => {
			const html = Markdown.toHtml('<style>body{display:none}</style><form><input name="password"><button>Log in</button></form>');

			expect(html).to.not.contain("<style");
			expect(html).to.not.contain("<form");
			expect(html).to.not.contain("<input");
			expect(html).to.not.contain("<button");
		});

		it('Fits images to the width and keeps the aspect ratio from the URL', () => {
			const html = Markdown.toHtml("![img](https://example.com/img.png?w=640&h=480)");

			expect(html).to.contain("max-width: 100%");
			expect(html).to.contain("height: auto");
			expect(html).to.contain("aspect-ratio: 640 / 480");
		});
	});

	describe("sanitize", () => {
		it('Keeps safe HTML and removes scripts', () => {
			const html = Markdown.sanitize('<p class="x">Hello</p><script>alert(1)</script>');

			expect(html).to.equal('<p class="x">Hello</p>');
		});
	});

	describe("addImageSize", () => {
		it('Adds the size to a URL with and without a query', () => {
			expect(Markdown.addImageSize("https://example.com/img.png", 10, 20)).to.equal("https://example.com/img.png?w=10&h=20");
			expect(Markdown.addImageSize("https://example.com/download.php?blob=1", 10, 20)).to.equal("https://example.com/download.php?blob=1&w=10&h=20");
		});
	});

	describe("contentToHtml", () => {
		it('Renders markdown and leaves HTML as it is', () => {
			expect(Markdown.contentToHtml("**bold**", "markdown")).to.contain("<strong>bold</strong>");
			expect(Markdown.contentToHtml("**bold**", "html")).to.equal("**bold**");
			expect(Markdown.contentToHtml("<b>x</b>")).to.equal("<b>x</b>");
		});
	});
});
