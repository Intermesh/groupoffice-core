import {avatar, Component, fieldset, form, t, textfield} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";
import {filesbutton} from "../../components/index.js";
import {client} from "../../jmap/index.js";

class Account extends AbstractSettingsPanel {
	constructor() {
		super("account", t("Account"));

		this.items.add(
			form({},

				fieldset({legend: t("User")},



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

	}
}

settingsPanels.addPanel(Account);