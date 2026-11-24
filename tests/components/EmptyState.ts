import {expect} from "chai";
import {describe} from "mocha";
import {datasourcestore, RestDataSource, root} from "@intermesh/goui";
import {emptystate, EmptyState} from "../../script/components/EmptyState.js";

describe("EmptyState class", () => {

	const create = (config: Partial<EmptyState> = {}) => {
		const store = datasourcestore({dataSource: new RestDataSource("http://localhost/api")});
		const e = emptystate({
			store,
			icon: "sticky_note_2",
			heading: "No notes yet",
			description: "Notes keep information",
			addText: "Add note",
			onAdd: () => {},
			...config
		});
		root.items.add(e);
		return e;
	};

	const addButton = (e: EmptyState) => e.el.querySelector("button") as HTMLButtonElement;

	// GOUI sets text with innerText
	const text = (e: EmptyState, selector: string) => (e.el.querySelector(selector) as HTMLElement).innerText;

	describe("refresh", () => {

		it("Explains the items and offers to add one without a search", function () {
			const e = create();

			expect(text(e, "h3")).to.equal("No notes yet");
			expect(text(e, "p")).to.equal("Notes keep information");
			expect(addButton(e).hidden).to.equal(false);

			e.remove();
		});

		it("Says that nothing is found while searching", function () {
			const e = create();
			(e.store as any).setFilter("search", {text: "meeting"});
			e.refresh();

			expect(text(e, "h3")).to.equal("No items found");
			expect(addButton(e).hidden).to.equal(true);

			e.remove();
		});

		it("Hides the add button when the user may not add", function () {
			const e = create({mayAdd: () => false});

			expect(addButton(e).hidden).to.equal(true);

			e.remove();
		});

		it("Hides the add button without an add handler", function () {
			const e = create({onAdd: undefined});

			expect(addButton(e).hidden).to.equal(true);

			e.remove();
		});
	});

	describe("isFiltered", () => {

		it("Ignores empty filters", function () {
			const e = create();
			(e.store as any).setFilter("search", {text: ""});
			(e.store as any).setFilter("user", {});

			expect(e.isFiltered()).to.equal(false);

			e.remove();
		});

		it("Ignores a filter that is set to null", function () {
			const e = create();
			(e.store as any).setFilter("search", null);

			expect(e.isFiltered()).to.equal(false);

			e.remove();
		});

		it("Ignores filters that aren't in filterNames, like the selected notebook", function () {
			const e = create();
			(e.store as any).setFilter("notebook", {noteBookId: [1]});

			expect(e.isFiltered()).to.equal(false);

			e.remove();
		});

		it("Uses the filterNames of the list", function () {
			const e = create({filterNames: ["status"]});
			(e.store as any).setFilter("status", {start: "<=now"});

			expect(e.isFiltered()).to.equal(true);

			e.remove();
		});

		it("Counts a null value as a filter", function () {
			const e = create({filterNames: ["assignedToMe"]});
			(e.store as any).setFilter("assignedToMe", {responsibleUserId: null});

			expect(e.isFiltered()).to.equal(true);

			e.remove();
		});
	});
});
