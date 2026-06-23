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

		this.allButtons = ArrayUtil.multiSort(main.getPanels(), [{property:"title"}]).map(m => {
			return comp({
					itemId: m.id,
					cls: "launcher-item"
				},
				btn({
					style: {
						backgroundImage: `url(${client.downloadUrl("core/moduleIcon/" + (m.package ?? "legacy") + "/" + m.module)})`
					},
					itemId: "btn",

					text: m.title,
					handler: () => {
						router.goto(m.id);
					}
				}),
				comp({cls: "goui-badge", hidden:true, itemId: "badge"})
			)
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
							console.log(b)
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

	public setBadge(panelId:string, count:number|undefined) {
		const cmp = this.allButtons.find(b => {
			return b.itemId == panelId;
		})

		if(!cmp) {
			throw "Not found";
		}

		const badge =cmp.findChild("badge")!;

		badge.hidden = !count;
		badge.text = count ? count?.toString() : "";
	}
}