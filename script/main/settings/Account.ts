import {comp, fieldset, form, t, textfield} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";
import {imagefield} from "../../components/index.js";
import {client} from "../../jmap/index.js";
import {User, userDS} from "../../auth/index.js";

class Account extends AbstractSettingsPanel {
	private form;
	constructor() {
		super("account", t("Account"));

		this.items.add(
			this.form = form({},

				fieldset({legend: t("User")},

					imagefield({
						name: "avatarId",
						width: 200
					}),

					comp({cls: "flow", flex: 1, minWidth: 200},
						textfield({
							label: t("Username"),
							name: "username",
							required: true
						}),

						textfield({
							label: t("E-mail"),
							name: "email",
							required: true
						}),

						textfield({
							label: t("Recovery e-mail"),
							name: "recoveryEmail",
							required: true
						})
					)
				)
			)
		)

	}

	async save(){
		return this.form.isModified() ? userDS.update(client.user.id, this.form.modified) : undefined;
	}

	async load(user: User): Promise<any> {
		this.form.value = user;
	}
}

settingsPanels.add(Account);