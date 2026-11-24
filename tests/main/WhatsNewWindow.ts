import {expect} from "chai";
import {describe} from "mocha";
import {WhatsNewWindow} from "../../script/main/WhatsNewWindow.js";

describe("WhatsNewWindow class", () => {

	const releases = [
		{version: "26.0.62", date: "23-11-2026", changes: ["Calendar: Events can be dragged", "A change without a module"]},
		{version: "26.0.61", date: "16-11-2026", changes: ["Core: <img src=x onerror=alert(1)> is shown as text"]}
	];

	// GOUI sets text with innerText, which jsdom doesn't render
	const texts = (w: WhatsNewWindow, selector: string) => Array.from(w.el.querySelectorAll<HTMLElement>(selector)).map(e => e.innerText);

	it("Lists the releases with their version", function () {
		const w = new WhatsNewWindow(releases);
		w.show();

		expect(texts(w, ".whats-new-version h3")).to.deep.equal(["26.0.62", "26.0.61"]);
		expect(w.el.querySelectorAll("li").length).to.equal(3);

		w.close();
	});

	it("Shows the module of a change in bold", function () {
		const w = new WhatsNewWindow(releases);
		w.show();

		expect(texts(w, "li strong")[0]).to.equal("Calendar");
		expect(texts(w, "li span")[0]).to.equal(": Events can be dragged");

		w.close();
	});

	it("Shows a change without a module as it is", function () {
		const w = new WhatsNewWindow(releases);
		w.show();

		expect((w.el.querySelectorAll("li")[1] as HTMLElement).innerText).to.equal("A change without a module");

		w.close();
	});

	it("Doesn't turn HTML in a change into elements", function () {
		const w = new WhatsNewWindow(releases);
		w.show();

		expect(w.el.querySelector("li img")).to.equal(null);

		w.close();
	});
});
