import {ArrayUtil, btn, comp, Menu, TextField, textfield,router} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {main} from "./Main.js";

export class Launcher extends Menu {
	private searchFld;
	private allButtons;
	private modulesContainer;
	constructor() {
		super();

		this.cls = "launcher";
		this.hidden = true;
		this.removeOnClose = false;

		this.el.addEventListener("click", () => {
			this.hide();
		})

		this.allButtons = ArrayUtil.multiSort(main.getMainPanels(), [{property:"title"}]).map(m => {
			return comp({}, btn({
				style: {
					backgroundImage: `url(${client.downloadUrl("core/moduleIcon/" + (m.package ?? "legacy") + "/" + m.module)})`
				},
				itemId: m.id,

				text: m.title,
				handler: () => {
					router.goto(m.id);
				}
			}))
		})

		this.items.add(
			this.searchFld = textfield({
				cls: "launcher-search-field",
				flex: 1,
				icon: "search",
				buttons: [
					btn({
						icon: "clear",
						handler: btn => {
							const tf = btn.findAncestorByType(TextField)!
							tf.reset()
							tf.focus();
						}
					})]
			})
				.on("render", ({target})=> {
					target.input.addEventListener("focus", ev => {
						ev.stopPropagation();
					})

					target.input.on("keydown", e => {
						if(e.key == "Enter") {
							const first = this.modulesContainer.items.first();
							if(first)
								first.items.get(0)!.el.click();
						}
					})
				})
				.on("input", ({value}) => {
					if(value) {
						this.modulesContainer.items.replace(...this.allButtons.filter((b) => {
							// console.log(b.te)
							return b.text.toLowerCase().startsWith(value.toLowerCase());
						}));
					} else {
						this.modulesContainer.items.replace(...this.allButtons);
					}
				}, {buffer: 300})


			,

			this.modulesContainer = comp({cls: "modules-container"})

		)

		this.on("show", () => {
			this.searchFld.value = "";
			this.modulesContainer.items.replace(...this.allButtons);

			this.searchFld.focus();
		})

	}
}