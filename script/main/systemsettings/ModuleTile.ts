import {
	btn,
	checkbox,
	comp,
	Component,
	ComponentEventMap, displayfield,
	fieldset,
	h4,
	img,
	p,
	Panel,
	t,
	tbar,
	Window
} from "@intermesh/goui";
import {client, jmapds} from "../../jmap/index.js";
import {ModuleInfo} from "./Apps.js";
import {Module} from "../../Modules.js";
import {FormWindow} from "../../components/index.js";
import {AppDialog} from "./AppDialog.js";
import {InstallModuleTileEventMap} from "./InstallModuleTile.js";


export interface ModuleTileEventMap extends ComponentEventMap {

	install: {module: ModuleInfo}

}


export class ModuleTile extends Component<ModuleTileEventMap> {
	constructor(m:ModuleInfo) {
		super();

		// this.width = 400;
		this.cls = "card module installed vbox";
		this.itemId = m.id;

		this.items.add(

			comp({cls: "desc"},

				img({src: client.downloadUrl("core/moduleIcon/" + m.id)}),
				h4(m.title),

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
								void jmapds("core/ModuleInfo").update(m.id, {enabled: newValue});
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
					title: t("Settings"),
					icon: "settings",
					hidden: !m.installed,
					handler: () => {
						const d = new AppDialog(m);
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
				btn({
					cls: "filled primary",
					hidden: m.installed,
					text: t("Install"),
					handler: () => {

						this.mask();
						try {
							void jmapds("core/ModuleInfo").update(m.id, {installed: true});
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

