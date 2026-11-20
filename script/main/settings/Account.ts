import {
	ArrayField,
	arrayfield,
	btn,
	checkbox,
	comp,
	ContainerField,
	containerfield,
	datasourceform,
	DateTime,
	displayfield, Fieldset,
	fieldset,
	hiddenfield,
	MapField,
	mapfield,
	numberfield, p,
	passwordfield,
	selectfield,
	t,
	TextField,
	textfield,
	Window
} from "@intermesh/goui";
import {AbstractSettingsPanel} from "./AbstractSettingsPanel.js";
import {userSettingsPanels, UserSettingsWindow} from "./UserSettingsWindow.js";
import {imagefield} from "../../components";
import {User, userDS} from "../../auth";
import {modules} from "../../Modules";
import {client} from "../../jmap";
import {AppPasswords} from "./AppPasswords.js";
import {customFields, FormFieldset} from "../../customfields/index.js";

export class Account extends AbstractSettingsPanel {
	private passwordFieldSet;
	private convertToLocalFieldset;
	private appPasswords: AppPasswords;
	constructor() {
		super("account", t("Account"), "account_box");
		const core = modules.get("core", "core")!;
		const rights = core.userRights,
			settings = core.settings,
			// User custom field sets shown as a tab are added as a page by the UserSettingsWindow
			customFieldsets = customFields.getFieldSets("User").filter(fs => !fs.isTab).map(fs => new FormFieldset(fs));

		this.items.add(this.form = datasourceform({dataSource: userDS, width: 700},
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

			this.passwordFieldSet = fieldset({legend: t('Password')},
				hiddenfield({
					name: "currentPassword"
				}),
				passwordfield({
					autocomplete: "new-password",
					minLength: settings.minPasswordLength,
					required: false,
					name: "password"
				})
					.on("generatepassword", ({target, password}) => {
						(target.nextSibling() as TextField).value = password;
					}),
				textfield({
					itemId: "confirmPassword",
					label: t("Confirm password"),
					required: false,
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
			),

			this.convertToLocalFieldset = fieldset({legend: t('Password')},
					p(t("This user doesn't have a local password because it's authenticated using an external provider. Click the button below to set a password and convert it to a local user. The domain will be stripped off the username")),
					btn({
						text: t("Convert to local user"),
						handler: button => {
							this.togglePassword(true);

							const usernameField = this.form!.findField("username") as TextField;
							usernameField.value = usernameField.value.split("@")[0];
							usernameField.focus();
						}

					})
				),

			fieldset({
					legend: t('Disk space'),
					hidden: !rights.mayChangeUsers
				},
				numberfield({
					name:'disk_quota', label: t('Disk quota'),
					suffix:'MB',
					decimals:0,
					hint:	t("Setting '0' will disable uploads for this user. Leave this field empty to allow unlimited space.")}),
				numberfield({name:'disk_usage',decimals:0, label: t('Space used'),suffix:'b', readOnly:true})
			),

			fieldset({legend: t("Authorized clients")},
				comp({cls: "scroll", style: {maxHeight: "30rem"}},

					arrayfield({
						name:'clients',
						listeners: {
							setvalue: ev => {
								const fs = ev.target.findAncestorByType(Fieldset)!;

								fs.legend = t("Authorized clients") + `&nbsp;<span class="badge">${ev.newValue.length}</span>`
							}
						},
						buildField: record => {
							const	field = containerfield(({cls: 'group'}),

								displayfield({
									name: 'ip', flex: 1, htmlEncode: false, renderer: _ => [
										record.ip || "?",
										(record.platform || "?") + ' ' + (record.name || "?"),
										record.lastSeen ? (new DateTime(record.lastSeen)).format(client.user.dateFormat + " " + client.user.timeFormat) : "?"
									].join('<br>')
								}),
								selectfield({
									name: 'status', width: 140, options: [
										{value: 'new', text: t('New')},
										{value: 'allowed', text: t('Allowed')},
										{value: 'denied', text: t('Denied')}
									]
								}),
								btn({
									icon: "delete",
									title: "Delete",
									handler: (btn) => {
										field.remove();
									}
								})
							)

							return field;
						},

					})
				),

				btn({text: t('Logout all')}).on('click', ({target}) => {
					const clientFld = target.previousSibling()!.items.first() as ArrayField;

					clientFld.value = [];
				})
			),

			this.appPasswords = new AppPasswords(),

			...customFieldsets
		))

		// Every custom field set has a "customFields" field. Merge them, otherwise the last one overwrites the others.
		this.form.on("beforesave", ({data}) => {
			const modified = customFieldsets.map(fs => fs.findChildByType(ContainerField)!).filter(f => f.isModified());
			if (modified.length) {
				data.customFields = Object.assign({}, ...modified.map(f => f.value));
			}
		});

		this.form.on("saveerror", ({error}) => {
			const currentPasswordError = error.type == "invalidProperties" ? error.validationErrors?.currentPassword : undefined;
			if (currentPasswordError) {
				// 1 is ErrorCode::REQUIRED, otherwise the entered password was wrong
				void Window.alert(currentPasswordError.code == 1 ?
					t("Your current password is required to save these changes") :
					t("The current password you entered was incorrect"), t("Invalid password"));
			}
		});
	}

	/**
	 * Set to true by other components in this panel that need the current password to save, like the OTP setup.
	 */
	public currentPasswordRequired = false;

	/**
	 * Check if the user must enter the current password to save the changes.
	 *
	 * The server requires it when users change their own password, e-mail or recovery e-mail address. Administrators
	 * and user managers who change another user don't need it.
	 */
	private needCurrentPassword(): boolean {
		if (this.currentPasswordRequired) {
			return true;
		}

		if (client.user.isAdmin) {
			return false;
		}

		if (modules.get("core", "core")!.userRights.mayChangeUsers && this.form!.currentId != client.user.id) {
			return false;
		}

		const modified = this.form!.modified;
		return ["password", "email", "recoveryEmail"].some(name => name in modified);
	}

	async save(): Promise<boolean> {

		const currentPasswordFld = this.form!.findField("currentPassword")!;

		if (this.needCurrentPassword()) {
			const currentPassword = await this.findAncestorByType(UserSettingsWindow)!.currentPasswordPrompt();
			if (!currentPassword) {
				return false;
			}
			currentPasswordFld.value = currentPassword;
		}

		try {
			const success = await super.save();
			if (success) {
				this.currentPasswordRequired = false;
			}
			return success;
		} finally {
			// The current password is only valid for this save. Ask again next time.
			currentPasswordFld.reset();
		}
	}

	async load(user: User): Promise<any> {
		const ret = super.load(user);
		void this.appPasswords.load(user);

		// Disable password fieldset if there's no password authentication method.
		// User logged in via imap or ldap authenticator for example.
		// If there are 0 authenticators we enable it too, so it's possible to set a password.
		this.togglePassword(user.authenticators.length === 0 || user.authenticators.indexOf("password") > -1);

		return ret;
	}

	private togglePassword(hasPassword: boolean) {

		const fields = ['username', 'password', 'confirmPassword', 'email', 'recoveryEmail'];

		fields.forEach(f => {
			const field = this.form!.findField(f) as TextField
			field.disabled = !hasPassword;
		})

		this.passwordFieldSet.hidden = !hasPassword;

		if (modules.get("core", "core")!.userRights.mayChangeUsers) {
			this.convertToLocalFieldset.hidden = hasPassword;

		}
	}
}

userSettingsPanels.add(Account);