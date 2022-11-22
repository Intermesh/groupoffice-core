import {Observable, ObservableListener} from "@goui/component/Observable.js";
import {form, Form} from "@goui/component/form/Form.js";
import {comp} from "@goui/component/Component.js";
import {CardContainer, cards} from "@goui/component/CardContainer.js";
import {t} from "@goui/Translate.js";
import {client, ForgottenData} from "@goui/jmap/Client.js";
import {fieldset} from "@goui/component/form/Fieldset.js";
import {textfield} from "@goui/component/form/TextField.js";
import {tbar} from "@goui/component/Toolbar.js";
import {btn} from "@goui/component/Button.js";
import {Notifier} from "@goui/Notifier.js";
import {Window, WindowEventMap} from "@goui/component/Window.js";
import {RegisterForm} from "./RegisterForm.js";


export interface LoginEventMap<T extends Observable> extends WindowEventMap<T> {
	cancel: () => void
	login: () => void
}

export interface Login {
	on<K extends keyof LoginEventMap<Login>>(eventName: K, listener: Partial<LoginEventMap<Login>>[K]): void;

	fire<K extends keyof LoginEventMap<Login>>(eventName: K, ...args: Parameters<LoginEventMap<Login>[K]>): boolean;

	set listeners(listeners: ObservableListener<LoginEventMap<this>>)
}


export class Login extends Window {

	private loginForm!: Form;

	private otpForm!: Form;

	private loginToken = "";

	private cardContainer!: CardContainer;
	private registerForm!: Form;
	private forgotPasswordForm!: Form;

	constructor() {
		super();

		this.width = 480;
		this.height = 800;
		this.title = t("Login");
		this.cls = "login";
		this.modal = true;
		this.resizable = true;


		this.on("close", async window => {
			if (!await client.isLoggedIn()) {
				// closed without successful login
				await Window.alert(t("Login required"), t("Login is required for this page. You will return to the previous page."));

				history.back();
			}
		})

		this.loginForm = form({
				cls: "vbox fit",
				handler: (form: Form) => {
					this.login(form);
				}
			},
			fieldset({
					flex: "1",
					cls:  "scroll"
				},
				comp({
					tagName: "p",
					html: t("Please enter your username and password")
				}),
				textfield({
					label: t("Username"),
					name: "username",
					autocomplete: "username",
					required: true
				}),
				textfield({
					label: t("Password"),
					type: "password",
					name: "password",
					autocomplete: "current-password",
					required: true
				}),
				btn({
					style: {
						width: "100%"
					},
					type: "submit",
					text: t("Login")
				}),


				btn({
					style: {
						width: "100%"
					},
					cls: "raised",
					type: "button",
					text: t("Register"),
					handler: () => {
						this.showRegisterForm();
					}
				}),

				comp({style: {display: "flex", justifyContent: "center"}},
					btn({
						cls: "small",
						text: t("Forgot password?"),
						type: "button",
						handler: () => {
							this.showForgotPassword();
						}
					})
				),
			)
		);

		this.otpForm = form({
				flex: 1,
				hidden: true,
				handler: (form: Form) => {
					client.auth({
						loginToken: this.loginToken,
						authenticators: {
							otpauthenticator: <{ code: string }>form.getValues()
						}
					}).then(response => {
						console.log(response);

						switch (response.status) {
							case 201:
								return this.onLoginSuccess(response);

							default:
								Notifier.error(response.statusText);
						}
					})
				}
			},
			fieldset({
					flex: "1",
					cls:  "scroll"
				},
				comp({
					tagName: "p",
					html: t("Please provide the one time code from your device")
				}),

				textfield({
					label: "Code",
					name: "otp_code",
					required: true,
					autocomplete: "one-time-code"
				})
			),

			tbar({},
				btn({
					type: "button",
					text: t("Cancel"),
					handler: () => {
						this.close();
						this.fire("cancel");
					}
				}),
				comp({
					flex: 1
				}),

				btn({
					type: "submit",
					text: t("Login")
				})
			)
		);

		this.cardContainer = cards({flex: 1}, this.loginForm, this.otpForm);

		this.items.add(this.cardContainer);
	}

	private showForgotPassword() {

		if (!this.forgotPasswordForm) {
			this.forgotPasswordForm = form(
				{
					cls: "vbox fit",
					handler: async (form) => {
						this.loginForm.show();

						const response = await client.auth(Object.assign({action: "forgotten"}, form.getValues() ) as ForgottenData);

						Notifier.success(t("If an account was found, you should receive an e-mail with instructions shortly."));

					}
				},
					fieldset({flex: 1} ,

						comp({
							tagName: "p",
							text: t("Please enter your e-mail address to receive an e-mail to reset your password.")
						}),

						textfield({
							name: "email",
							type: "email",
							label: t("E-mail"),
							required: true
						}),

					),

				tbar({},
					btn({
						type: "button",
						text: t("Cancel"),
						handler: () => {
							this.forgotPasswordForm.reset();
							this.loginForm.show();
						}
					}),
					comp({
						flex: 1
					}),

					btn({
						type: "submit",
						text: t("Send")
					})
				)
				);


			this.cardContainer.items.add(this.forgotPasswordForm);
		}

		this.forgotPasswordForm.show();
		this.forgotPasswordForm.focus();
	}

	private showRegisterForm() {

		if (!this.registerForm) {
			this.registerForm = new RegisterForm();
			this.registerForm.on("submit", (form) => {
				if(form.isValid()) {
					this.close();
					Notifier.success(t("Registration and successful"));
					this.fire("login");
				}
			});

			this.registerForm.on("cancel", (form) => {
				this.registerForm.reset();
				this.loginForm.show();
			});
			this.cardContainer.items.add(this.registerForm);
		}

		this.registerForm.show();
		this.registerForm.findField("displayName")!.focus();
	}

	focus(o?: FocusOptions) {
		this.loginForm.focus(o);
	}

	async login(form: Form) {

		try {
			this.mask();
			const response = await client.auth(form.getValues());

			switch (response.status) {
				case 200:
					response.json().then((responseData: any) => {

						this.loginToken = responseData.loginToken;
						//this.loginForm.hide();
						this.otpForm.show();
						this.otpForm.focus();
					});
					break;

				case 201:
					return this.onLoginSuccess(response);

				default:
					this.loginForm.findField("username")!.setInvalid(response.statusText);

					Notifier.error(response.statusText);
			}
		} catch (e) {
			Notifier.error("Sorry, an unexpected error occurred: " + e);
		} finally {
			this.unmask();
		}
	}

	private async onLoginSuccess(response: any) {
		const session = await response.json();

		delete session.debug;
		delete session.accounts;
		delete session.state; // for extjs stuff

		client.session = session;
		Notifier.success(t("Logged in successfully"));
		this.close();
		this.fire("login");

	}
}
