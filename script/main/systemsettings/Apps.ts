import {ArrayUtil, btn, comp, Component, h3, searchbtn, t, tbar, Window} from "@intermesh/goui";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {client} from "../../jmap/index.js";
import {AppTile} from "./AppTile.js";

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





class AppSystemSettings {
	private panels: Record<string, (new () => Component)[]> = {};

	public addPanel(modulePackage:string, moduleName:string, cmp: (new () => Component)) {
		const id = modulePackage+"/"+moduleName;
		if(!this.panels[id]) {
			this.panels[id] = [];
		}
		this.panels[id].push(cmp);
	}

	public getPanels(modulePackage:string, moduleName:string) {
		return this.panels[modulePackage+"/"+moduleName] ?? [];
	}
}

export const appSystemSettings = new AppSystemSettings();

systemSettingsPanels.add(SystemSettingsApps);
