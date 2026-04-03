import {FormWindow} from "../../../components/index.js";
import {
	autocompletechips, browser, btn, checkbox,
	checkboxselectcolumn,
	column,
	datasourcestore,
	fieldset, Notifier, p, passwordfield,
	t,
	table,
	TextField,
	textfield
} from "@intermesh/goui";
import {groupDS} from "../../../auth/index.js";
import {modules} from "../../../Modules.js";



export class CreateUserDialog extends FormWindow {
	constructor() {
		super("User");

		this.modal = true;

		this.title = t("Create user");

		this.width = 460;
		this.height = 740;

		const settings = modules.get("core", "core")!.settings;
		this.generalTab.items.add(

			fieldset({},
				textfield({
					label: t("Name"),
					name: "displayName",
					required: true,
					listeners: {
						change: ({target, newValue}) => {
							const usernameFld = target.nextSibling() as TextField, emailField = usernameFld.nextSibling() as TextField;
							usernameFld.value = newValue.toLowerCase().replace(/\s+/g, ".");

							emailField.value = usernameFld.value + "@";
						}
					}
				}),

				textfield({
					label: t("Username"),
					name: "username",
					required: true,
					pattern: "[A-Za-z0-9_\\-.@]*"
				}),

				textfield({
					label: t("E-mail"),
					name: "email",
					required: true,
					listeners: {
						change: ({target, newValue}) => {
							const recoveryEmailFld = target.nextSibling() as TextField;
							if(recoveryEmailFld.value == "")
								recoveryEmailFld.value = newValue;
						}
					}
				}),

				textfield({
					label: t("Recovery e-mail"),
					name: "recoveryEmail",
					required: true,
					hint: t("This e-mail will be used to recover the password if the user forgets it.")
				}),
			),

			fieldset({},
				passwordfield({
					autocomplete: "new-password",
					minLength: settings.minPasswordLength,
					required: true,

				})
					.on("generatepassword", ({target, password}) => {
						(target.nextSibling() as TextField).value = password;
					}),
				textfield({
					label: t("Confirm password"),
					required: true,
					type: "password",
					autocomplete: "new-password",
					listeners: {
						validate: ({target}) => {
							const passwordFld = target.previousSibling() as TextField;

							if(target.value != passwordFld.value) {
								target.setInvalid("The passwords don't match");
							}
						}
					}
				}),
				checkbox({name: "forcePasswordChange", label: t("Force password change")}),
			),

			fieldset({},

				autocompletechips({
					list: table({
						fitParent: true,
						headers: false,
						store: datasourcestore({
							dataSource: groupDS,
							filters: {
								default: {
									excludeEveryone: true,
									hideUsers: true
								}
							}
						}),
						rowSelectionConfig: {
							multiSelect: true
						},
						columns: [
							checkboxselectcolumn(),
							column({
								header: "Name",
								id: "name",
								sortable: true,
								resizable: true
							})
						]
					}),
					label: t("Groups"),
					name: "groups",

					chipRenderer: async (chip, value) => {
						chip.text = (await groupDS.single(value)).name;
					},
					pickerRecordToValue(field, record): any {
						return record.id;
					},
					listeners: {
						autocomplete: ({target, input}) => {
							target.list.store.setFilter("autocomplete", {text: input});
							void target.list.store.load();
						}
					},

					value: modules.get("core","core")!.settings.defaultGroups,
				})

				)
		);
	}
}