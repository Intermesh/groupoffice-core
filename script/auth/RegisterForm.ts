import {btn, comp, fieldset, Form, t, tbar, textfield} from "@intermesh/goui";
import {client, RegisterData} from "../jmap/index.js";


export class RegisterForm extends Form {

	handler = async (form: Form) => {
		const data = {action: "register" as RegisterData['action'], user: form.value};
		data.user.mail_reminders = true;

		const response = await client.auth(data);

		switch (response.status) {
			case 201:
				client.session = await response.json()
				break;

			default:

				form.setInvalid(response.statusText);
				break;
		}

	}

	constructor() {
		super();

		this.cls = "vbox fit";

		this.items.add(

			fieldset({cls:  "flow scroll", flex: 1},
				comp({
					tagName: "p",
					html: t("Please enter your e-mail address to register")
				}),

				textfield({
					label: t("Name"),
					name: "displayName",
					required: true
				}),

				textfield({
					type: "email",
					label: t("E-mail"),
					name: "email",
					required: true,
					listeners: {
						change: ({target}) => {
							if (!target.isValid()) {
								return;
							}
							const username = this.findField("username")!;
							if (username.isEmpty()) {
								username.value = target.value;
							}

						}
					}
				}),

				textfield({
					type: "text",
					label: t("Username"),
					name: "username",
					required: true
				}),

				textfield({
					required: true,
					type: "password",
					label: t("Password"),
					name: "password"

				}),

				textfield({
					itemId: "confirm",//item ID used instead of name so this field won't be submitted
					type: "password",
					label: t("Confirm password"),
					required: true,
					listeners: {
						validate: ({target}) => {
							const form = target.findAncestorByType(Form)!;
							if (target.value != form.findField("password")!.value) {
								target.setInvalid("The passwords don't match");
							}
						}
					},
				}),


			),

			tbar( {},
				btn({
					type: "button",
					text: t("Cancel"),
					handler: () => {
						this.fire("cancel", this);
					}
				}),
				comp({
					flex: 1
				}),
				btn({
					type: "submit",
					text: t("Register")
				})
			)
		);

	}
}
