import {ArrayUtil, btn, Button, comp, Component, h3, searchbtn, t, tbar, TextField, textfield, Window} from "@intermesh/goui";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {adminOnly, systemSettingsPanels} from "./SystemSettingsWindow.js";
import {modules} from "../../Modules.js";
import {client, jmapds} from "../../jmap/index.js";
import {InstallModuleTile} from "./InstallModuleTile.js";
import {LicenseWindow} from "../LicenseWindow.js";

export interface ModuleInfo {
	id: string
	name: string
	package: string
	title: string
	author: string
	description: string
	rights: any
	status: string
	packageTitle: string
	category: string,
	enabled: boolean
	installed: boolean
	model: any
	available: boolean
	documentationUrl: string
}

class SystemSettingsModules extends AbstractSystemSettingsPanel {
	private appContainer: Component;
	private trialButton: Button;
	constructor() {
		super("modules", t("Modules"), "apps");

		this.cls = "fit vbox";
		this.items.add(
			tbar({cls: "border-bottom"},
				this.trialButton = btn({
					icon: "star",
					cls: "accent",
					text: t("Trial license"),
					hidden: !this.mayGetTrialLicense(),
					handler: () => {
						const win = new LicenseWindow();
						win.on("close", () => {
							this.trialButton.hidden = !this.mayGetTrialLicense();
						});
						win.show();
					}
				}),
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
					cls: "accent filled",
					icon: "add",
					// installing modules is for administrators only. Others only manage the settings of their modules.
					hidden: !client.user.isAdmin,
					handler: () => {
						const win = new InstallWindow();
						win.on("close", () => this.reload())
						win.show();
					}
				})),
			this.appContainer = comp({cls: "apps"},)
			)
	}
	/**
	 * Administrators can get a trial license when there's no license yet, and it isn't set in the configuration file
	 */
	private mayGetTrialLicense(): boolean {
		const settings = modules.get("core", "core")?.settings;
		return !!client.user.isAdmin && !settings?.license && (settings?.readOnlyKeys ?? []).indexOf("license") == -1;
	}

	async reload() {
		response = undefined;
		return this.load()
	}
	async load(text = ""): Promise<any> {

		if(!response) {
			try {
				response = await client.jmap("core/ModuleInfo/get");
			}catch (e) {
				void Window.error(e);
			} finally {
				this.unmask()
			}
		}

		this.appContainer.items.clear()

		const sorted = ArrayUtil.multiSort(response.list, [{property: "category"}, {property: "title"}]) as ModuleInfo[];

		let lastCategory = "";
		sorted.filter(m => m.installed).forEach(m => {

			if(text && !m.title.toLowerCase().includes(text.toLowerCase())) return;

			if(lastCategory != m.category) {
				this.appContainer.items.add(h3(m.category));
				lastCategory = m.category;
			}

			const tile = new InstallModuleTile(m);
			tile.on("destroy", () => {
				this.reload();
			})

			this.appContainer.items.add(tile);
		})
	}
}

let response: any;

class InstallWindow extends Window {
	private appContainer: Component
	private searchField;

	constructor() {
		super();
		this.title = t("Install apps");
		this.modal = true;

		this.width = 1280;
		this.height = 800;
		this.maximizable = true;
		this.resizable = true;

		this.on("show", () => {
			void this.load();
		});

		this.items.add(
			tbar({cls: "border-bottom"},
				this.searchField = textfield({
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
					.on("input", ({value}) => {
						this.load(value);
					}, {buffer: 300})
				),
				this.appContainer = comp({cls: "apps",flex: 1}
			))
	}

	focus(o?: FocusOptions) {
		this.searchField.focus(o);
	}

	async reload() {
		response = undefined;
		return this.load()
	}

	async load(text:string = "") {


		if(!response) {
			this.mask();
			try {
				response = await client.jmap("core/ModuleInfo/get");
			}catch (e) {
				void Window.error(e);
			} finally {
				this.unmask()
			}

		}

		this.appContainer.items.clear();
		const sorted = ArrayUtil.multiSort(response.list, [{property: "category"}, {property: "title"}]) as ModuleInfo[];

		let lastCategory = "";
		sorted.filter(m => !m.installed).forEach(m => {

			if(text && !m.title.toLowerCase().includes(text.toLowerCase())) return;

			if(lastCategory != m.category) {
				this.appContainer.items.add(h3(m.category));
				lastCategory = m.category;
			}

			const tile = new InstallModuleTile(m);
			tile.on("install", () => {
				this.reload();
			})
			this.appContainer.items.add(tile);
		})
	}
}





class ModuleSystemSettings {
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

export const moduleSystemSettings = new ModuleSystemSettings();

// Administrators and users that may manage a module. The server only returns the modules they may manage.
systemSettingsPanels.add(SystemSettingsModules, () => adminOnly() || modules.getAll().some(m => m.enabled && m.userRights?.mayManage));
