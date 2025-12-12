import {comp, fieldset, form, t, textfield} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";
import {imagefield} from "../../components/index.js";
import {client} from "../../jmap/index.js";
import {userDS} from "../../auth/index.js";

class Account extends AbstractSettingsPanel {
	private form;
	constructor() {
		super("account", t("Account"));

		this.items.add(
			this.form = form({},

				fieldset({legend: t("User")},

					imagefield({
						name: "avatarId",
						value: client.user.avatarId,
						width: 200
					}),

					comp({cls: "flow", flex: 1, minWidth: 200},
						textfield({
							label: t("Username"),
							name: "username",
							required: true,
							value: client.user.username
						}),

						textfield({
							label: t("E-mail"),
							name: "username",
							required: true,
							value: client.user.email
						}),

						textfield({
							label: t("Recovery e-mail"),
							name: "recoveryEmail",
							required: true,
							value: client.user.recoveryEmail
						})
					)
				)
			)
		)

	}

	async save(){
		return userDS.update(client.user.id, this.form.value);
	}
}

settingsPanels.addPanel(Account);