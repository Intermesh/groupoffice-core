import {a, btn, Button, comp, Component, h3, MaterialIcon, p, t, tbar} from "@intermesh/goui";

/**
 * A step of a {@link Tour}
 */
export interface TourStep {
	/**
	 * The element the step points at. Without it, or when it isn't visible, the step shows in the centre of the screen.
	 */
	target?: () => HTMLElement | undefined | null
	icon?: MaterialIcon
	title: string
	text: string
	/**
	 * A link under the text, like to the documentation. It opens in a new tab.
	 */
	link?: {
		text: string
		href: string
	}
}

/**
 * Space between the highlighted element and the step card, and between the card and the edge of the screen
 */
const margin = 12;

/**
 * Walks the user through a few elements of the screen, one step at a time
 *
 * Every step highlights its target and shows a card with an explanation next to it. The rest of the screen is dimmed
 * and can't be clicked until the tour ends. Escape ends it, the arrow keys go to the next and previous step.
 *
 * ```
 * new Tour([
 * 	{title: t("Welcome"), text: t("This tour shows you around.")},
 * 	{target: () => searchButton.el, icon: "search", title: t("Search"), text: t("Search everything.")}
 * ]).start();
 * ```
 */
export class Tour {
	private readonly blocker: Component;
	private readonly spotlight: Component;
	private readonly card: Component;
	private readonly iconEl: Component;
	private readonly titleEl: Component;
	private readonly textEl: Component;
	private readonly linkEl: Component;
	private readonly progressEl: Component;
	private readonly backButton: Button;
	private readonly nextButton: Button;

	private index = 0;
	private running = false;

	private readonly onKeyDown = (e: KeyboardEvent) => this.keyDown(e);
	private readonly onResize = () => this.position();

	/**
	 * Called when the tour ends, also when the user skips it
	 */
	public onEnd?: () => void;

	constructor(private readonly steps: TourStep[]) {
		this.blocker = comp({cls: "tour-blocker"});
		this.spotlight = comp({cls: "tour-spotlight"});

		this.card = comp({cls: "tour-card", attr: {role: "dialog", "aria-modal": "true"}},
			comp({cls: "hbox gap tour-title"},
				this.iconEl = comp({tagName: "i", cls: "icon"}),
				this.titleEl = h3()
			),
			this.textEl = p(),
			this.linkEl = a({cls: "normal-link tour-link", target: "_blank"}),
			tbar({},
				this.progressEl = comp({cls: "tour-progress"}),
				"->",
				btn({
					text: t("Skip"),
					handler: () => this.end()
				}),
				this.backButton = btn({
					text: t("Back"),
					handler: () => this.go(this.index - 1)
				}),
				this.nextButton = btn({
					cls: "filled primary",
					handler: () => this.next()
				})
			)
		);
	}

	/**
	 * Shows the first step
	 */
	public start() {
		if(this.running || !this.steps.length) {
			return;
		}
		this.running = true;

		this.blocker.render(document.body);
		this.spotlight.render(document.body);
		this.card.render(document.body);

		document.addEventListener("keydown", this.onKeyDown, true);
		window.addEventListener("resize", this.onResize);

		this.go(0);
	}

	/**
	 * Removes the tour from the screen
	 */
	public end() {
		if(!this.running) {
			return;
		}
		this.running = false;

		document.removeEventListener("keydown", this.onKeyDown, true);
		window.removeEventListener("resize", this.onResize);

		this.card.remove();
		this.spotlight.remove();
		this.blocker.remove();

		this.onEnd?.();
	}

	private next() {
		if(this.index < this.steps.length - 1) {
			this.go(this.index + 1);
		} else {
			this.end();
		}
	}

	private go(index: number) {
		if(index < 0 || index >= this.steps.length) {
			return;
		}
		this.index = index;
		const step = this.steps[index];

		this.iconEl.text = step.icon ?? "tour";
		this.titleEl.text = step.title;
		this.textEl.text = step.text;
		this.linkEl.hidden = !step.link;
		if(step.link) {
			this.linkEl.text = step.link.text;
			this.linkEl.el.setAttribute("href", step.link.href);
		}
		this.progressEl.text = t("{current} of {total}")
			.replace("{current}", String(index + 1))
			.replace("{total}", String(this.steps.length));

		this.backButton.hidden = index == 0;
		this.nextButton.text = index == this.steps.length - 1 ? t("Done") : t("Next");

		this.position();
		this.nextButton.focus();
	}

	/**
	 * The rectangle of the target of the current step, or undefined when it has none or it isn't visible
	 */
	private targetRect(): DOMRect | undefined {
		const el = this.steps[this.index].target?.();
		if(!el) {
			return undefined;
		}
		const rect = el.getBoundingClientRect();
		return rect.width && rect.height ? rect : undefined;
	}

	private position() {
		const rect = this.targetRect(),
			card = this.card.el;

		this.blocker.el.classList.toggle("dim", !rect);
		this.spotlight.hidden = !rect;

		if(!rect) {
			card.style.left = Math.max(margin, (window.innerWidth - card.offsetWidth) / 2) + "px";
			card.style.top = Math.max(margin, (window.innerHeight - card.offsetHeight) / 2) + "px";
			return;
		}

		const s = this.spotlight.el.style;
		s.left = (rect.left - 4) + "px";
		s.top = (rect.top - 4) + "px";
		s.width = (rect.width + 8) + "px";
		s.height = (rect.height + 8) + "px";

		// Below the target when it fits, otherwise above it
		let top = rect.bottom + margin;
		if(top + card.offsetHeight > window.innerHeight - margin) {
			top = Math.max(margin, rect.top - margin - card.offsetHeight);
		}

		// Centred under the target, but on the screen
		let left = rect.left + rect.width / 2 - card.offsetWidth / 2;
		left = Math.min(Math.max(margin, left), window.innerWidth - card.offsetWidth - margin);

		card.style.left = left + "px";
		card.style.top = top + "px";
	}

	private keyDown(e: KeyboardEvent) {
		switch(e.key) {
			case "Escape":
				this.end();
				break;
			case "ArrowRight":
				this.next();
				break;
			case "ArrowLeft":
				this.go(this.index - 1);
				break;
			default:
				return;
		}

		e.preventDefault();
		e.stopPropagation();
	}
}
