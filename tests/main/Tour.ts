import {expect} from "chai";
import {describe} from "mocha";
import {Tour} from "../../script/main/Tour.js";

describe("Tour class", () => {

	const steps = [
		{title: "Welcome", text: "First"},
		{title: "Search", text: "Second", target: () => document.body},
		{title: "Done", text: "Last"}
	];

	// GOUI sets text with innerText, which jsdom doesn't render
	const title = () => (document.querySelector(".tour-card h3") as HTMLElement).innerText;
	const button = (text: string) => Array.from(document.querySelectorAll<HTMLButtonElement>(".tour-card button"))
		.find(b => (b.querySelector(".text") as HTMLElement | null)?.innerText == text)!;
	const key = (k: string) => document.dispatchEvent(new KeyboardEvent("keydown", {key: k}));

	describe("start", () => {
		it("Shows the first step without a back button", function () {
			const tour = new Tour(steps);
			tour.start();

			expect(title()).to.equal("Welcome");
			expect(document.querySelector(".tour-blocker")).to.not.equal(null);
			expect(button("Back").hidden).to.equal(true);

			tour.end();
		});

		it("Doesn't start twice", function () {
			const tour = new Tour(steps);
			tour.start();
			tour.start();

			expect(document.querySelectorAll(".tour-card").length).to.equal(1);

			tour.end();
		});
	});

	describe("navigation", () => {
		it("Goes to the next and previous step with the buttons", function () {
			const tour = new Tour(steps);
			tour.start();

			button("Next").click();
			expect(title()).to.equal("Search");
			expect(button("Back").hidden).to.equal(false);

			button("Back").click();
			expect(title()).to.equal("Welcome");

			tour.end();
		});

		it("Goes to the next and previous step with the arrow keys", function () {
			const tour = new Tour(steps);
			tour.start();

			key("ArrowRight");
			expect(title()).to.equal("Search");

			key("ArrowLeft");
			key("ArrowLeft");
			expect(title()).to.equal("Welcome");

			tour.end();
		});

		it("Shows Done on the last step and ends with it", function () {
			let ended = false;
			const tour = new Tour(steps);
			tour.onEnd = () => ended = true;
			tour.start();

			key("ArrowRight");
			key("ArrowRight");
			expect(button("Done")).to.not.equal(undefined);

			button("Done").click();
			expect(ended).to.equal(true);
			expect(document.querySelector(".tour-card")).to.equal(null);
		});
	});

	describe("end", () => {
		it("Ends with Escape and removes everything", function () {
			let ended = false;
			const tour = new Tour(steps);
			tour.onEnd = () => ended = true;
			tour.start();

			key("Escape");

			expect(ended).to.equal(true);
			expect(document.querySelector(".tour-blocker")).to.equal(null);
			expect(document.querySelector(".tour-spotlight")).to.equal(null);
			expect(document.querySelector(".tour-card")).to.equal(null);
		});

		it("Ends with Skip", function () {
			const tour = new Tour(steps);
			tour.start();

			button("Skip").click();

			expect(document.querySelector(".tour-card")).to.equal(null);
		});

		it("Stops listening to the keyboard", function () {
			const tour = new Tour(steps);
			tour.start();
			tour.end();

			// Would throw or show a card when the listener were still there
			key("ArrowRight");
			expect(document.querySelector(".tour-card")).to.equal(null);
		});
	});

	describe("link", () => {
		it("Shows the link of a step only on that step", function () {
			const tour = new Tour([
				{title: "Welcome", text: "First"},
				{title: "Done", text: "Last", link: {text: "Read the documentation", href: "https://example.com/docs"}}
			]);
			tour.start();

			const link = document.querySelector(".tour-card a") as HTMLAnchorElement;
			expect(link.hidden).to.equal(true);

			key("ArrowRight");
			expect(link.hidden).to.equal(false);
			expect(link.getAttribute("href")).to.equal("https://example.com/docs");
			expect(link.target).to.equal("_blank");
			expect(link.innerText).to.equal("Read the documentation");

			tour.end();
		});
	});

	describe("position", () => {
		it("Shows a step in the centre when its target isn't visible", function () {
			// jsdom has no layout, so every element has an empty rectangle
			const tour = new Tour(steps);
			tour.start();
			key("ArrowRight");

			expect(document.querySelector(".tour-blocker")!.classList.contains("dim")).to.equal(true);
			expect((document.querySelector(".tour-spotlight") as HTMLElement).hidden).to.equal(true);

			tour.end();
		});
	});
});
