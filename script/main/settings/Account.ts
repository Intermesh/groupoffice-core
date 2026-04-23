import {
	checkbox,
	comp,
	datasourceform,
	fieldset,
	numberfield,
	passwordfield,
	t,
	TextField,
	textfield
} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {settingsPanels} from "./SettingsWindow.js";
import {imagefield} from "../../components/index.js";
import {User, userDS} from "../../auth/index.js";
import {modules} from "../../Modules";

settingsPanels.add(class Account extends AbstractSettingsPanel {
	constructor() {
		super("account", t("Account"), "account_box");
		const core = modules.get("core", "core")!;
		const rights = core.userRights,
			settings = core.settings;

		this.items.add(this.form = datasourceform({dataSource: userDS},
			fieldset({},
				comp({ width: 200},
					imagefield({name: "avatarId"}),
					checkbox({name: "enabled", label: t("Enabled"),type: "switch", hidden: !rights.mayChangeUsers})
				),
				comp({cls: "flow", flex: 1, minWidth: 200},
					textfield({name: "displayName", label: t("Name"), required: true}),
					textfield({name: "username", label: t("Username"), required: true, pattern: "[A-Za-z0-9_\\-.@]*"}),
					textfield({name: "email", label: t("E-mail"),type:'email', required: true}),
					textfield({name: "recoveryEmail", label: t("Recovery e-mail"),type:'email', required: true,
						hint:t('The recovery e-mail is used to send a forgotten password request to.')+'<br>'
							+t('Please use an email address that you can access from outside Group-Office.')
					}),
				)
			),
			comp({cls:'flow'},
				fieldset({width: 320,legend: t('Disk space'), hidden: !rights.mayChangeUsers},
					numberfield({
						name:'disk_quota', label: t('Disk quota'),
						suffix:'MB',
						prefix: '€',
						decimals:0,
						hint:	t("Setting '0' will disable uploads for this user. Leave this field empty to allow unlimited space.")}),
					numberfield({name:'disk_usage', label: t('Space used'), readOnly:true})
				),
				fieldset({flex:1,legend: t('Password')},
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
					checkbox({name: "forcePasswordChange", label: t("Force password change"),hidden: !rights.mayChangeUsers}),
				)
			),
			fieldset({legend: t("Authorized clients")},

			)
		))
	}
});