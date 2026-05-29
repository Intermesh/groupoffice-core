import {btn, HtmlField, menu, Menu, p, root, t} from "@intermesh/goui";

export type HtmlFieldMentionProvider = (input: string) => Promise<{value:string, display:string }[]>;
export class HtmlFieldMentionPlugin {
	private menu?: Menu;
	constructor(readonly field:HtmlField, readonly provider: HtmlFieldMentionProvider, btnIndex:number|undefined = undefined) {

		const tbBtn = 	btn({
			icon: "alternate_email",
			title: t("Mention user"),
			tabIndex: -1, // Skip toolbar in tabbing through forms
			handler: () => {
				const lastChar = this.getPreviousChar();
				let insert = "@";
				// check if last typed char is not a space or nbsp;
				if(lastChar != 160 && lastChar != 32) {
					insert = " " + insert;
				}
				field.insertHtml(insert);
				field.focus();
				setTimeout(() => {
					this.mentionSequence = "";
					this.onMention("");
				}, 100)
			}
		});

		if(btnIndex) {
			field.getToolbar().items.insert(btnIndex, tbBtn);
		} else {
			field.getToolbar().items.add(tbBtn);
		}

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
				this.onMention("");
				return;
			}
		}

		if(this.mentionSequence === undefined) {
			return;
		} else {

			switch(ev.key) {
				case " ":
				case "@":
				case "Enter":
				case "Tab":
				case "Escape":
				case "Delete":
				case "ArrowUp":
					this.mentionSequence = undefined;
					this.menu?.hide();
					break;

				case "Backspace":
					if(!this.mentionSequence.length) {
						this.mentionSequence = undefined;
						this.menu?.hide();
						return;
					} else {
						this.mentionSequence = this.mentionSequence.substring(0, this.mentionSequence.length - 1);
					}
					this.onMention(this.mentionSequence);
					break;

				default:
					// only handle characters with 1 char length (No CapsLoc, Shift etc.)
					if(ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey) {
						this.mentionSequence += ev.key;
						this.onMention(this.mentionSequence);
					}
					break;
			}
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
		let coords = range.getBoundingClientRect();

		if(coords.x === 0) {
			// fallback on start of editor
			// somehow getting the coords for the first char doesn't work.
			coords = this.field.getEditor().getBoundingClientRect();
			coords.x += 30;
		} else {
			coords.x += 10;
		}

		return coords;
	}

	private onMention(mention: string) {

		if(!this.menu) {
			this.menu = menu({cls: "goui-dropdown", removeOnClose: false, autoFocusFirst: true, hidden: true});
			root.items.add(this.menu);

			this.field.on("remove", ()=> this.menu!.remove());
		}

		const coords = this.getCaretCoordinates();
		console.log(coords);
		if(!coords) {
			return;
		}
		this.menu.showAt(coords);

		this.provider(mention).then((names) => {

			if(names.length) {
				this.menu!.items.replace(
					...names.map(a => {

						return btn({text: a.display, dataSet: {value: a.value}})
							.on("click", ({target}) => {
								this.autocomplete(target.dataSet.value, mention);
								this.menu!.hide();
							})
					})
				);
			} else {
				this.menu!.items.replace(p({text: t("No results found")}));
			}

			this.menu!.showAt(coords);
		})
	}

	private autocomplete(text: string, typed: string) {

		if(typed.length) {
			//remove typed text and replace with result
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