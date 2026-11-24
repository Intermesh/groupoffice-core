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

	/**
	 * A badge for a module that isn't stable yet or will be removed. Stable modules have none.
	 *
	 * @param status "stable", "beta" or "deprecated", see go\core\Module::getStatus()
	 */
	private static statusBadge(status: string): Component[] {
		const labels: Record<string, string> = {
			beta: t("Beta"),
			deprecated: t("Deprecated")
		};
		if(!labels[status]) {
			return [];
		}
		return [comp({tagName: "span", cls: "module-status " + status, text: labels[status]})];
	}

	constructor(m:ModuleInfo) {
		super();

		// this.width = 400;
		this.cls = "card module vbox";
		this.itemId = m.id;

		// Only administrators may install, uninstall, enable or disable modules
		const isAdmin = client.user.isAdmin;

		this.items.add(

			comp({cls: "desc"},

				img({src: client.downloadUrl("core/moduleIcon/" + m.id)}),

				comp({} ,
					comp({cls: "title"},
						h4(m.title),
						...InstallModuleTile.statusBadge(m.status)
					),
					p(m.description)
				)
			),

			tbar({
				},

				checkbox({
					type: "switch",
					name: "enabled",
					hidden: !m.installed || !isAdmin,
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
						// d.form.on('beforesave', ({data}) => {
						// 	// In settings tables, arrays are always saved as comma-separated strings ?? huh?!?
						// 	Object.entries(data.settings).forEach(([key, value]) => {
						// 		if(key !== 'readOnlyKeys' && Array.isArray(value)) {
						// 			data.settings[key] = value.join(",");
						// 		}
						// 	})
						// })
						d.show();
					}
				}),

				this.deleteBtn = btn({
					title: t("Delete"),
					icon: "delete",
					hidden: !m.installed || m.enabled || !isAdmin,
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
					hidden: m.installed || !isAdmin,
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

