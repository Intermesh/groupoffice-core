import {btn, HtmlField, menu, Menu, root} from "@intermesh/goui";

export type HtmlFieldMentionProvider = (input: string) => Promise<{value:string, display:string }[]>;
export class HtmlFieldMentionPlugin {
	private menu?: Menu;
	constructor(readonly field:HtmlField, readonly provider: HtmlFieldMentionProvider) {
		field.on("render", ({target }) => {
			target.el.on("keydown", e => {
				if(this.menu && !this.menu.hidden) {
					switch (e.key) {
						case "Enter":
							const first = this.menu.items.get(0);
							if(first) {
								e.preventDefault();
								this.autocomplete(first.dataSet.value, this.mentionSequence!);
								this.menu!.hide();
							}
							break;
						case "ArrowDown":
							e.preventDefault();
							this.menu.focus();
							break;
						default:
							this.trackMention(e);
					}

				} else {
					this.trackMention(e);
				}
			})
		})
	}

	private mentionSequence:string | undefined = undefined;
	private trackMention(ev: KeyboardEvent) {

		if(ev.key == "@") {

			const lastChar = this.getPreviousChar();
			if(!lastChar || lastChar == 32 || lastChar == 160) {
				this.mentionSequence = "";
				return;
			}
		}

		if(this.mentionSequence === undefined) {
			return;
		} else if (ev.key == "Enter" || ev.key == "Tab" || ev.key == " " || ev.key == "@") {
			this.mentionSequence = undefined;
			this.menu?.hide();
		} else {

			if(ev.key == "Backspace") {
				if(!this.mentionSequence.length) {
					this.mentionSequence = undefined;
					this.menu?.hide();
					return;
				} else {
					this.mentionSequence = this.mentionSequence.substring(0, this.mentionSequence.length - 1);
				}
			} else {
				this.mentionSequence += ev.key;
			}

			this.onMention(this.mentionSequence, ev);
		}
	}

	private getPreviousChar() {
		const selection = window.getSelection();
		if (!selection || !selection.rangeCount) return;

		const range = selection.getRangeAt(0);
		// Only proceed if collapsed (no selection, just caret)
		if (!range.collapsed) return;

		const { startContainer, startOffset } = range;

		// Only handle text nodes
		if (startContainer.nodeType === Node.TEXT_NODE) {
			const text = startContainer.textContent;
			if(!text) {
				return;
			}
			return startOffset > 0 ? text[startOffset - 1].charCodeAt(0) : undefined;
		}
	}
	private getCaretCoordinates() {

		const selection = window.getSelection();
		if (!selection || !selection.rangeCount) return undefined;

		const range = selection.getRangeAt(0).cloneRange();
		// Collapse the range to the caret (insertion point)
		range.collapse(true);
		// Get the client rects (bounding box) for the caret
		return range.getBoundingClientRect();
	}

	private onMention(mention: string, ev: KeyboardEvent) {

		if(!this.menu) {
			this.menu = menu({cls: "goui-dropdown"});
			root.items.add(this.menu);

			this.field.on("remove", ()=> this.menu!.remove());
		}

		const coords = this.getCaretCoordinates();
		if(!coords) {
			return;
		}
		this.menu.showAt(coords);

		this.provider(mention).then((names) => {
			this.menu!.items.replace(
				...names.map(a => {

					return btn({text: a.display, dataSet: {value: a.value}})
						.on("click", ({target}) =>{
							this.autocomplete(target.dataSet.value, mention);
							this.menu!.hide();
						})
				})
			);
		})
	}

	private autocomplete(text: string, typed: string) {

		if(typed.length) {
			const sel = window.getSelection();
			const range = sel!.getRangeAt(0);
			const clone = range.cloneRange();

			clone.setStart(range.startContainer, range.startOffset - typed.length);
			clone.setEnd(range.startContainer, range.startOffset);
			clone.deleteContents();
		}

		this.field.insertHtml(text + "&nbsp;");
		this.field.focus();
		this.mentionSequence = undefined;
	}
}