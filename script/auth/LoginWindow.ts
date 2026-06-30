import {
	btn,
	Button,
	CardContainer,
	cards,
	checkbox,
	comp,
	Fieldset,
	fieldset,
	form,
	Form, menu,
	Notifier,
	t,
	tbar,
	textfield, Toolbar,
	Window,
	WindowEventMap
} from "@intermesh/goui";
import {RegisterForm} from "./RegisterForm.js";
import {client, ForgottenData} from "../jmap/index.js";
import {LanguageField} from "../components/index.js";

export interface LoginEventMap extends WindowEventMap {
	cancel: {}
	login: {}
}

export class LoginWindow extends Window<LoginEventMap> {

	private loginForm!: Form;

	private otpForm!: Form;

	private loginToken = "";

	private cardContainer!: CardContainer;
	private registerForm!: Form;
	private forgotPasswordForm!: Form;

	private signinButtonFieldSet: Fieldset;

	public addSignInButton(btn: Button) {
		this.signinButtonFieldSet.hidden = false;
		this.signinButtonFieldSet.items.add(btn);
	}

	protected createModalOverlayCls() {
		return "goui-window-modal-overlay login-overlay";
	}

	protected createHeader(): Toolbar {
		const header = super.createHeader();

		header.items.insert(-1,
			btn({
				icon: "language",
				menu: menu({
						listeners: {
							show: async ({target}) => {
								const c = await client.getCapabilities();

								target.items.add(...Object.entries(c.languages).map(([iso, text]) =>
									btn({
										handler: () => {
											document.location = BaseHref + "?lang=" + iso;
										},
										text
									})
								));
							}
						}
					},

				)
			})
		)

		return header;
	}

	constructor() {
		super();

		this.width = 480;
		this.height = "auto";
		this.title = t("Login");
		this.cls = "login";
		this.modal = true;
		this.resizable = false;
		this.draggable = false;
		this.draggable = false;


		this.on("show", async () => {
			const c = await client.getCapabilities();

			if(c.settings.allowRegistration) {
				this.findChild("register")!.hidden = false;
			}
		})

		this.on("close", async window => {
			if (!await client.isLoggedIn()) {
				// closed without successful login
				await Window.alert(t("Login is required for this page. You will return to the previous page."), t("Login required"));

				history.back();
			}
		})

		this.loginForm = form({
				cls: "vbox fit",
				handler: (form: Form) => {
					this.login(form);
				}
			},

			this.signinButtonFieldSet = fieldset({hidden: true, cls: "flow border-bottom"}),

			fieldset({
					flex: "1",
					cls:  "flow scroll"
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

				checkbox({
					type: "switch",
					label: t("Remember my login on this device"),
					name: "rememberLogin"
				}),

				btn({
					style: {
						width: "100%"
					},
					type: "submit",
					text: t("Login")
				}),


				btn({
					itemId: "register",
					style: {
						width: "100%"
					},
					cls: "filled",
					type: "button",
					hidden: true,
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
							void this.showForgotPassword();
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
							otpauthenticator: <{ code: string }>form.value
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
					cls:  "flow scroll"
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
				}).on('render', ({target}) => {
					target.el.inputMode = 'numeric';
					target.el.attr('maxlength', '6');
					target.el.attr('pattern', '[0-9]*');
					target.el.on('paste', e => {
						e.preventDefault();
						const text = e.clipboardData?.getData('text') || '';
						target.value = text.replace(/\D/g, '').slice(0, 6);
					})
				})
			),

			tbar({},
				btn({
					type: "button",
					text: t("Cancel"),
					handler: () => {
						this.close();
						this.fire("cancel", {});
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

	private async showForgotPassword() {

		const c = await client.getCapabilities();
		if(c.settings.lostPasswordURL){
			document.location.replace(c.settings.lostPasswordURL);
			return;
		}

		if (!this.forgotPasswordForm) {
			this.forgotPasswordForm = form(
				{
					cls: "vbox fit",
					handler: async (form) => {
						this.loginForm.show();

						const response = await client.auth(Object.assign({action: "forgotten"}, form.value ) as ForgottenData);

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
			this.registerForm.on("submit", ({target}) => {
				if(target.isValid()) {
					this.close();
					Notifier.success(t("Registration and successful"));
					this.fire("login", {});
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
			const response = await client.auth(form.value);

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
		client.session = await response.json();
		const success = await client.authenticate();
		if(!success) {
			Notifier.error("Sorry, an unexpected error occurred");
		} else {
			Notifier.success(t("Welcome back, {name}!").replace('{name}', client.user.displayName));
			this.hide();
			this.fire("login", {});
		}

	}
}
