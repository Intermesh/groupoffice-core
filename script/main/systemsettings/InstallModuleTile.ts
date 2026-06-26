import {
	btn,
	Button,
	ButtonEventMap,
	checkbox,
	comp,
	Component,
	ComponentEventMap,
	h4,
	img,
	p,
	t,
	tbar,
	Window
} from "@intermesh/goui";
import {client, jmapds} from "../../jmap/index.js";

import {ModuleDialog} from "./ModuleDialog.js";
import {ModuleInfo} from "./SystemSettingsModules.js";


export interface InstallModuleTileEventMap extends ComponentEventMap {

	install: {module: ModuleInfo}

	destroy: {module: ModuleInfo}
}


export class InstallModuleTile extends Component<InstallModuleTileEventMap> {
	private deleteBtn: Button;
	constructor(m:ModuleInfo) {
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
					disabled: !m.available,
					value: m.enabled,
					listeners:{
						change: async ({newValue, target}) => {
							this.mask();
							try {
								await jmapds("core/ModuleInfo").update(m.id, {enabled: newValue});

								this.deleteBtn.hidden = newValue
							}catch (e) {
								target.reset();
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
					title: t("Settings"),
					icon: "settings",
					hidden: !m.installed,
					disabled: !m.available,
					handler: () => {
						const d = new ModuleDialog(m);
						d.load(m.model.id);
						d.form.on('beforesave', ({data}) => {
							// In settings tables, arrays are always saved as comma-separated strings
							Object.entries(data.settings).forEach(([key, value]) => {
								if(key !== 'readOnlyKeys' && Array.isArray(value)) {
									data.settings[key] = value.join(",");
								}
							})
						})
						d.show();
					}
				}),

				this.deleteBtn = btn({
					title: t("Delete"),
					icon: "delete",
					hidden: !m.installed || m.enabled,
					handler: async () => {

						try {
							await jmapds("core/ModuleInfo").confirmDestroy([m.id]);
							this.fire("destroy", {module:m});
						}catch (e) {
							void Window.error(e);
						}

					}
				}),


				btn({
					cls: "filled primary",
					hidden: m.installed,
					text: t("Install"),
					handler: async () => {

						this.mask();
						try {
							await jmapds("core/ModuleInfo").update(m.id, {installed: true});
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

