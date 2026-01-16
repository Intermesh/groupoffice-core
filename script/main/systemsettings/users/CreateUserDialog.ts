import {FormWindow} from "../../../components/index.js";
import {
	autocompletechips, browser, btn,
	checkboxselectcolumn,
	column,
	datasourcestore,
	fieldset, Notifier,
	t,
	table,
	TextField,
	textfield
} from "@intermesh/goui";
import {groupDS} from "../../../auth/index.js";
import {modules} from "../../../Modules.js";


function generatePassword(length = 16) {
	const charset =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>?";
	const charsetLength = charset.length;

	const randomValues = new Uint32Array(length);
	window.crypto.getRandomValues(randomValues);

	let password = "";
	for (let i = 0; i < length; i++) {
		password += charset[randomValues[i] % charsetLength];
	}

	return password;
}


export class CreateUserDialog extends FormWindow {
	constructor() {
		super("User");

		this.modal = true;

		this.title = t("Create user");

		this.width = 460;
		this.height = 740;

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
					required: true
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
				textfield({
					label: t("Password"),
					name: "password",
					required: true,
					type: "password",
					autocomplete: "new-password",
					buttons: [btn({
						icon: "magic_button",
						handler: (btn) => {
							const pass = generatePassword(),
								passwordFld = btn.findAncestorByType(TextField)!,
								confirmFld = passwordFld.nextSibling() as TextField;
							passwordFld.value = confirmFld.value = pass;
							browser.copyTextToClipboard(pass);
							Notifier.success(t("The generated password has been copied to your clipboard."));
						}
					})]
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
				})
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