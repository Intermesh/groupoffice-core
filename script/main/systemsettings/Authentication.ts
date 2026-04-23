import {AbstractModuleSystemSettingsPanel} from "./AbstractModuleSystemSettingsPanel.js";
import {
	arrayfield,
	btn,
	checkbox,
	chips,
	comp,
	Component, Fieldset,
	fieldset,
	numberfield,
	t,
	tbar,
	textfield
} from "@intermesh/goui";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {domaincombo} from "../../auth/index.js";
import {authallowgroupgrid} from "./AuthAllowGroupGrid.js";
import {ModuleSettingsFieldset} from "./ModuleSettingsFieldset";

class Authentication extends AbstractModuleSystemSettingsPanel {

	private authAllowGroupGrid?: ReturnType<typeof authallowgroupgrid>;

	constructor() {
		super("authentication", t("Authentication"), "core", "core", "lock");
		// this.items.add(authSystemSettings.getFieldsets());
		for(const fs of authSystemSettings.getFieldsets()) {
			this.items.add(fs);
		}
	}

	protected formItems(): Component[] {
		return [
			fieldset({
					width: 400,
					legend: t("Password")
				},

				numberfield({
					name: "passwordMinLength",
					label: t("Minimum length"),
					value: 6,
					decimals: 0
				}),

				domaincombo({
					name: "defaultAuthenticationDomain",
					label: t("Default domain"),
					hint: t("Users can login without this domain behind the username. Note that if the user exists in the Group-Office database it will take precedence."),
				}),

				numberfield({
					name: "logoutWhenInactive",
					label: t("Logout when inactive"),
					hint: t("Logout users when inactive for more than this number of seconds. This will also disable the 'Remember my login' checkbox in the login dialog. 0 disables this setting."),
					value: 0,
					decimals: 0
				}),

				textfield({
					name: "lostPasswordURL",
					label: t("Lost password URL"),
					hint: t("You can set an URL to handle lost passwords in an alternative way")
				})
			),

			fieldset({
					legend: t("Allowed groups"),

				},

				comp({
					tagName: "p",
					text: t("Define which groups are allowed to login from which IP addresses. You can use '*' to match any charachters and '?'" +
						" to match any single character. eg. '192.168.1?.*'. Be careful, You can lock yourself out!")
				}),

				comp({cls: "frame"},
					tbar({
							cls: "bg-low border-bottom"
						},
						"->",
						btn({
							icon: "add",
							text: t("Add"),
							handler: () => {
								this.authAllowGroupGrid?.addNew();
							}
						})
					),

					this.authAllowGroupGrid = authallowgroupgrid()
				)
			),

			fieldset({
					legend: t("Synchronization")
				},

				checkbox({
					name: "activeSyncEnable2FA",
					label: t("Enable 2-Factor authentication for ActiveSync devices")
				}),

				checkbox({
					name: "activeSyncCanConnect",
					label: t("ActiveSync devices can connect by default."),
					hint: t("When disabled the administrator has to allow each new device manually")
				})
			),

			fieldset({
					legend: t("API settings")
				},

				comp({
					tagName: "p",
					text: t("Allow Cross Origin Requests from these origins")
				}),

				chips({
					name: "corsAllowOrigin",
					label: t("CORS origins"),
					hint: "eg. https://example.com"
				}),

				checkbox({
					name: "allowRegistration",
					label: t("Allow creation of users through the API"),
					hint: t("When enabled, you should restrict access for the 'Everyone' group as much as possible. Use with caution.")
				})
			)
		];
	}
}

class AuthenticationSystemSettings {
	// private fieldsets: Record<string, (new () => ModuleSettingsFieldset)[]> = {};
	private fieldsets: ModuleSettingsFieldset[] = [];//Record<string, (new () => ModuleSettingsFieldset)[]> = {};

	public addFieldset(modulePackage:string, moduleName:string, cmp: (new () => ModuleSettingsFieldset)) {
		const id = modulePackage+"/"+moduleName;
		this.fieldsets.push(new cmp);
		// if(!this.fieldsets[id]) {
		// 	this.fieldsets[id] = [];
		// }
		// this.fieldsets[id].push(cmp);
	}

	public getFieldsets() {
		return this.fieldsets ?? [];
	}

}
export const authSystemSettings = new AuthenticationSystemSettings();
systemSettingsPanels.add(Authentication);
