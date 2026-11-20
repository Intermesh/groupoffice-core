import {btn, comp, displayfield, fieldset, form, Form, Notifier, t, tbar, textfield, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";

/**
 * Lets the user choose a new password with the link of the password recovery e-mail
 *
 * The e-mail links to "#recover/<hash>". The main layout opens this window before the login when the URL has this hash.
 */
export class RecoveryWindow extends Window {

	private readonly form: Form;

	private redirectUrl?: string;

	constructor(private readonly hash: string) {
		super();

		this.title = t("Reset password");
		this.width = 480;
		this.height = "auto";
		this.modal = true;
		this.closable = false;
		this.resizable = false;
		this.draggable = false;

		this.items.add(
			this.form = form({
					cls: "vbox fit",
					handler: form => this.submit(form)
				},
				fieldset({cls: "flow"},
					comp({tagName: "p", itemId: "displayName"}),
					displayfield({label: t("Username"), name: "username"}),
					textfield({
						label: t("New password"),
						type: "password",
						name: "password",
						autocomplete: "new-password",
						required: true
					}),
					textfield({
						label: t("Confirm password"),
						type: "password",
						name: "confirmPassword",
						autocomplete: "new-password",
						required: true
					})
				),
				tbar({},
					"->",
					btn({
						type: "submit",
						cls: "filled primary",
						text: t("Change")
					})
				)
			)
		);
	}

	/**
	 * Check the link and ask for the new password
	 *
	 * @param redirectUrl Go to this URL after the password was changed. Only URLs of this GroupOffice are used.
	 * @return Resolves when the window closes
	 */
	public async verifyAndShow(redirectUrl?: string): Promise<void> {

		this.redirectUrl = redirectUrl;

		const closed = new Promise<void>(resolve => this.on("close", () => resolve()));

		this.show();
		this.mask();
		try {
			const response = await client.auth({action: "recover", hash: this.hash});
			const result = response.ok ? await response.json() : {};
			if (!result.username) {
				this.close();
				await Window.alert(t("This password recovery link is invalid"), t("Error"));
				return;
			}

			this.form.findChild("displayName")!.text = result.displayName;
			this.form.findField("username")!.value = result.username;
			this.form.findField("password")!.focus();
		} catch (e) {
			this.close();
			await Window.error(e);
			return;
		} finally {
			this.unmask();
		}

		return closed;
	}

	private async submit(form: Form) {
		const confirm = form.findField("confirmPassword")!;
		if (form.findField("password")!.value != confirm.value) {
			confirm.setInvalid(t("The passwords didn't match"));
			return;
		}

		this.mask();
		try {
			const response = await client.auth({
				action: "recover",
				hash: this.hash,
				newPassword: form.findField("password")!.value as string
			});
			const result = response.ok ? await response.json() : {};

			if (!result.passwordChanged) {
				for (const name in result.validationErrors ?? {}) {
					form.findField(name)?.setInvalid(result.validationErrors[name].description);
				}
				Notifier.error(t("Sorry, an error occurred") + (response.ok ? "" : ": " + response.statusText));
				return;
			}

			const redirectUrl = this.getSafeRedirectUrl();
			if (redirectUrl) {
				document.location.href = redirectUrl;
				return;
			}

			this.close();
			await Window.alert(t("Your password was changed successfully"), t("Success"));
		} catch (e) {
			void Window.error(e);
		} finally {
			this.unmask();
		}
	}

	/**
	 * The link can be changed by anyone, so it must not send the user to another website
	 */
	private getSafeRedirectUrl(): string | undefined {
		if (!this.redirectUrl) {
			return undefined;
		}
		try {
			const url = new URL(decodeURIComponent(this.redirectUrl), BaseHref);
			return url.origin === location.origin ? url.href : undefined;
		} catch (e) {
			return undefined;
		}
	}
}
