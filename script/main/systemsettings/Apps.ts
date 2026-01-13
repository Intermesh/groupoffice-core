import {ArrayUtil, btn, comp, Component, h3, Panel, searchbtn, t, tbar, Window} from "@intermesh/goui";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {client} from "../../jmap/index.js";
import {AppTile} from "./AppTile.js";
import {Module} from "../../Modules.js";

export interface Module2 {
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
	documentationUrl: string
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
				searchbtn({
					listeners: {
						input: ({text}) => {
							this.load(text);
						}
					}
				}),
				btn({
					text: t("Install"),
					icon: "add",
					handler: () => {
						const win = new InstallWindow();
						win.on("close", () => this.reload())
						win.show();
					}
				})),
			this.appContainer = comp({cls: "apps"},)
			)
	}
	async reload() {
		response = undefined;
		return this.load()
	}
	async load(text = ""): Promise<any> {

		if(!response) {
			try {
				response = await client.jmap("core/Module2/get");
			}catch (e) {
				void Window.error(e);
			} finally {
				this.unmask()
			}
		}

		this.appContainer.items.clear()

		const sorted = ArrayUtil.multiSort(response.list, [{property: "packageTitle"}, {property: "title"}]) as Module2[];

		let lastPackage = "";
		sorted.filter(m => m.installed).forEach(m => {

			if(text && !m.title.toLowerCase().includes(text.toLowerCase())) return;

			if(lastPackage != m.packageTitle) {
				this.appContainer.items.add(h3(m.packageTitle));
				lastPackage = m.packageTitle;
			}

			this.appContainer.items.add(new AppTile(m));
		})

		return Promise.all(this.findChildrenByType(AppSystemSettingsPanel).map(p => p.load()));
	}

	async save(): Promise<any> {
		return Promise.all(this.findChildrenByType(AppSystemSettingsPanel).map(p => p.save()));
	}
}

let response: any;

class InstallWindow extends Window {
	private appContainer: Component

	constructor() {
		super();
		this.title = t("Install apps");
		this.modal = true;

		this.width = 900;
		this.height = 600;
		this.maximizable = true;
		this.resizable = true;

		this.on("show", () => {
			void this.load();
		});

		this.items.add(
			tbar({cls: "border-bottom"},
				"->",
				searchbtn({
					listeners: {
						input: ({text}) => {
							this.load(text);
						}
					}
				})
				),
				this.appContainer = comp({cls: "apps",flex: 1}
			))
	}

	async reload() {
		response = undefined;
		return this.load()
	}

	async load(text:string = "") {
		this.appContainer.items.clear();

		if(!response) {
			this.mask();
			try {
				response = await client.jmap("core/Module2/get");
			}catch (e) {
				void Window.error(e);
			} finally {
				this.unmask()
			}

		}

		const sorted = ArrayUtil.multiSort(response.list, [{property: "packageTitle"}, {property: "title"}]) as Module2[];

		let lastPackage = "";
		sorted.filter(m => !m.installed).forEach(m => {

			if(text && !m.title.toLowerCase().includes(text.toLowerCase())) return;

			if(lastPackage != m.packageTitle) {
				this.appContainer.items.add(h3(m.packageTitle));
				lastPackage = m.packageTitle;
			}

			const tile = new AppTile(m);
			tile.on("install", () => {
				this.reload();
			})
			this.appContainer.items.add(tile);
		})
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
