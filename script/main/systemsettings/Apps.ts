import {
	ArrayUtil,
	btn,
	checkbox,
	comp,
	Component,
	ComponentEventMap,
	h3,
	h4,
	img,
	p,
	panel,
	Panel,
	t,
	tbar
} from "@intermesh/goui";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {client} from "../../jmap/index.js";

interface Module {
	id: string
	name: string
	package: string
	title: string
	author: string
	description: string
	rights: any
	status: string
	packageTitle: string
	enabled: boolean
	installed: boolean
	model: any
	installable: boolean
}

class SystemSettingsApps extends AbstractSystemSettingsPanel {
	private appContainer: Component;
	constructor() {
		super("apps", t("Apps"), "apps");


		// this.items.add(...appSystemSettings.getPanels().map(p => new p))

		this.cls = "fit vbox";
		this.items.add(
			tbar({cls: "border-bottom"},
				"->",
				btn({
					text: t("Install"),
					icon: "add"
				})),
			this.appContainer = comp({cls: "apps", flex: 1},)
			)
	}

	async load(): Promise<any> {

		const response = await client.jmap("core/Module2/get")
		console.log(response);

		const sorted = ArrayUtil.multiSort(response.list, [{property: "packageTitle"}, {property: "title"}]) as Module[];

		// sorted

		let lastPackage = "";
		sorted.filter(m => m.installed).forEach(m => {

			if(lastPackage != m.packageTitle) {
				this.appContainer.items.add(h3(m.packageTitle));
				lastPackage = m.packageTitle;
			}

			this.appContainer.items.add(comp({
				width: 400,
				cls: "card module vbox",
				itemId: m.id,
				dataSet: {
					icon: "apps"
				}
			},
				img({src: client.downloadUrl("core/moduleImg/" + m.id)}),

				h4(m.title),
				p(m.description),
				tbar({
				},
					btn({
						cls: "filled",
						hidden: m.installed,
						text: t("Install"),
					}),
					checkbox({
						type: "switch",
						name: "enabled",
						hidden: !m.installed,
						value: m.enabled,
						listeners:{
							change: ({newValue}) => {
								client.jmap("core/Module2/set", {
									update: {[m.id]: {enabled: newValue}}
								});
							}
						}
					}),
					"->",
					btn({
						text: t("Settings"),
						hidden: !m.installed
					})
				)
				))
		})

		return Promise.all(this.findChildrenByType(AppSystemSettingsPanel).map(p => p.load()));
	}

	async save(): Promise<any> {
		return Promise.all(this.findChildrenByType(AppSystemSettingsPanel).map(p => p.save()));
	}
}


export class AppSystemSettingsPanel extends Panel {
	constructor() {
		super();
		this.baseCls = 'panel app-settings-panel';
		this.collapsed = true;
	}

	public async save() : Promise<any> {
		return Promise.resolve();
	}

	public async load() :Promise<any> {
		return Promise.resolve();
	}
}


class AppSystemSettings {
	private panels: Record<string, typeof AppSystemSettingsPanel[]> = {};

	public addPanel(modulePackage:string, moduleName:string, cmp: typeof AppSystemSettingsPanel) {
		this.panels[modulePackage+"/"+moduleName].push(cmp);
	}

	public getPanels(modulePackage:string, moduleName:string) {
		return this.panels[modulePackage+"/"+moduleName] ?? [];
	}
}

export const appSystemSettings = new AppSystemSettings();

systemSettingsPanels.add(SystemSettingsApps);
