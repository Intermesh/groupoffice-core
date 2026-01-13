import {btn, checkbox, comp, Component, ComponentEventMap, h4, img, p, t, tbar, Window} from "@intermesh/goui";
import {client, jmapds} from "../../jmap/index.js";
import {Module2} from "./Apps.js";
import {Module} from "../../Modules.js";


export interface AppTileEventMap extends ComponentEventMap {

	install: {module: Module2}

}


export class AppTile extends Component<AppTileEventMap> {
	constructor(m:Module2) {
		super();

		// this.width = 400;
		this.cls = "card module vbox";
		this.itemId = m.id;

		this.items.add(

			comp({cls: "desc"},

				img({src: client.downloadUrl("core/moduleIcon/" + m.id)}),

				comp({} ,
					h4(m.title),
					p(m.description)
				)
			),

			tbar({
				},

				checkbox({
					type: "switch",
					name: "enabled",
					hidden: !m.installed,
					value: m.enabled,
					listeners:{
						change: async ({newValue}) => {
							this.mask();
							try {
								void jmapds("core/Module2").update(m.id, {enabled: newValue});
							}catch (e) {
								void Window.error(e);
							}
							finally {
								this.unmask();
							}
						}
					}
				}),
				"->",
				btn({
					title: t("Documentation"),
					icon: "help",
					hidden: !m.documentationUrl,
					handler: () => {
						window.open(m.documentationUrl);
					}
				}),
				btn({
					text: t("Settings"),
					hidden: !m.installed
				}),
				btn({
					cls: "filled primary",
					hidden: m.installed,
					text: t("Install"),
					handler: () => {

						this.mask();
						try {
							void jmapds("core/Module2").update(m.id, {installed: true});
							this.fire("install", {module:m});
						}catch (e) {
							void Window.error(e);
						}
						finally {
							this.unmask();
						}
					}
				})
			)
		);
	}
}