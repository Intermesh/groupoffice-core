import {ArrayUtil, btn, Component} from "@intermesh/goui";
import {modules} from "../Modules.js";
import {router} from "../Router.js";
import {client} from "../jmap/index.js";

export class Launcher extends Component {
	constructor() {
		super();

		this.cls = "launcher";
		this.hidden = true;

		this.el.addEventListener("click", () => {
			this.hide();
		})

		ArrayUtil.multiSort(modules.getMainPanels(), [{property:"title"}]).forEach(async (m) => {



			// Add button to the route
			this.items.add(
				btn({
					style: {
						backgroundImage: `url(${client.downloadUrl("core/moduleIcon/" + (m.package ?? "legacy") + "/" + m.module)})`
					},
					itemId: m.id,

					text: m.title,
					handler: () => {
						router.goto(m.id);
					}
				})
			);
			// }
		});
	}
}