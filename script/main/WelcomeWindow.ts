import {btn, Button, comp, Component, h3, MaterialIcon, p, router, t, tbar, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {moduleDS, modules} from "../Modules.js";

/**
 * A step of the welcome window that opens a page of the system settings
 */
interface WelcomeStep {
	icon: MaterialIcon
	title: string
	description: string
	/**
	 * Route of the system settings page, like "systemsettings/general"
	 */
	route: string
}

/**
 * Shown to the administrator after the installation. Lists the system settings to go through and offers to generate
 * demo data.
 *
 * The window stays open while the administrator opens the settings, so they return to the list after every step.
 * Closing it sets the core setting "welcomeShown", generating demo data sets "demoDataAsked".
 */
export class WelcomeWindow extends Window {
	private demoButton?: Button;

	constructor() {
		super();

		this.title = t("Welcome!");
		this.cls = "welcome vbox";
		this.width = 640;
		this.modal = true;
		this.resizable = true;

		const coreModule = modules.get("core", "core")!;

		const steps: WelcomeStep[] = [
			{
				icon: "description",
				title: t("General"),
				description: t("Set the title, the URL and the default language of this installation."),
				route: "systemsettings/general"
			},
			{
				icon: "notifications",
				title: t("Notifications"),
				description: t("Set the mail server that sends the system e-mail, like password resets and reminders."),
				route: "systemsettings/notifications"
			},
			{
				icon: "palette",
				title: t("Appearance"),
				description: t("Add your logo and colors."),
				route: "systemsettings/appearance"
			},
			{
				icon: "apps",
				title: t("Modules"),
				description: t("Choose the features your users need and who may use them."),
				route: "systemsettings/modules"
			},
			{
				icon: "group",
				title: t("Groups"),
				description: t("Put users in groups to share items and give permissions to many users at once."),
				route: "systemsettings/groups"
			},
			{
				icon: "account_box",
				title: t("Users"),
				description: t("Create accounts for your users, or let them log in with an existing account in Authentication."),
				route: "systemsettings/users"
			}
		];

		const rows = steps.map(step => this.createStep(step));
		if(!coreModule.settings.demoDataAsked) {
			rows.push(this.createDemoStep());
		}
		rows.push(this.createRow("menu_book", t("Getting started"),
			t("Read the guide that explains the basics of GroupOffice."),
			btn({
				cls: "outlined",
				text: t("Open"),
				handler: () => {
					window.open("https://www.group-office.com/docs/latest/getting-started.html", "_blank");
				}
			})
		));

		this.items.add(
			comp({flex: 1, cls: "scroll pad"},
				p(t("Go through these settings to complete the installation. This list stays open, so you can return to it after every step.")),
				...rows
			),
			tbar({cls: "border-top"},
				"->",
				btn({
					cls: "filled primary",
					text: t("Done"),
					handler: () => this.close()
				})
			)
		);

		this.on("close", () => {
			void moduleDS.update(coreModule.id, {settings: {welcomeShown: true}});
		});
	}

	private createStep(step: WelcomeStep): Component {
		return this.createRow(step.icon, step.title, step.description,
			btn({
				cls: "outlined",
				text: t("Open"),
				handler: () => void router.goto(step.route)
			})
		);
	}

	private createDemoStep(): Component {
		this.demoButton = btn({
			cls: "outlined",
			text: t("Generate"),
			handler: () => void this.generateDemoData()
		});

		return this.createRow("science", t("Demo data"),
			t("Fill the modules with fake contacts, events, tasks and more to try GroupOffice. This takes one or two minutes."),
			this.demoButton
		);
	}

	private createRow(icon: MaterialIcon, title: string, description: string, button: Button): Component {
		return comp({cls: "welcome-step hbox gap"},
			comp({tagName: "i", cls: "icon", text: icon}),
			comp({flex: 1},
				h3(title),
				p(description)
			),
			button
		);
	}

	private async generateDemoData() {
		const coreModule = modules.get("core", "core")!;

		this.mask();
		try {
			client.raiseNextRequestTimeout(180000);
			// Sets "demoDataAsked" on the server
			await client.jmap("core/System/demo");
			coreModule.settings.demoDataAsked = true;
			this.demoButton!.disabled = true;
			this.demoButton!.text = t("Generated");
		} catch (e) {
			void Window.error(e);
		} finally {
			this.unmask();
		}
	}
}
