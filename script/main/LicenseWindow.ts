import {btn, comp, fieldset, form, t, tbar, textarea, Window} from "@intermesh/goui";
import {moduleDS, modules} from "../Modules.js";

/**
 * Lets an administrator enter the license key, or decline a license
 *
 * Opened with "Register" in the user menu. Not available when the license is set in the configuration file.
 */
export class LicenseWindow extends Window {

	constructor() {
		super();

		this.title = t("Register");
		this.width = 600;
		this.height = 520;
		this.modal = true;
		this.resizable = true;
		this.cls = "vbox";

		const coreModule = modules.get("core", "core")!;

		this.items.add(
			form({
					flex: 1,
					cls: "vbox",
					handler: form => this.save({licenseDenied: false, license: form.value.license})
				},
				fieldset({flex: 1, cls: "vbox gap"},
					comp({
						tagName: "p",
						html: t('Try the extra features for free and obtain a 60 day trial license from <a target="_blank" class="normal-link" href="https://www.group-office.com">www.group-office.com</a>. Register for an account and get your license now. By purchasing a license you will get support and extra features. Find out more on our website.')
					}),
					comp({},
						btn({
							type: "button",
							cls: "filled primary",
							text: t("Get license now"),
							handler: () => {
								window.open("https://www.group-office.com/account#trial/" + encodeURIComponent(document.domain), "_blank");
							}
						})
					),
					textarea({
						flex: 1,
						name: "license",
						label: t("License key"),
						required: true,
						value: coreModule.settings.license ?? ""
					})
				),
				tbar({cls: "border-top"},
					btn({
						type: "button",
						text: t("Later"),
						handler: () => this.close()
					}),
					btn({
						type: "button",
						text: t("No thanks"),
						handler: () => this.save({licenseDenied: true, license: null})
					}),
					"->",
					btn({
						type: "submit",
						cls: "filled primary",
						text: t("Save")
					})
				)
			)
		);
	}

	private async save(settings: {licenseDenied: boolean, license: string | null}) {
		const coreModule = modules.get("core", "core")!;

		this.mask();
		try {
			await moduleDS.update(coreModule.id, {settings});
			this.close();
			// The licensed modules become available
			location.reload();
		} catch (e) {
			void Window.error(e);
		} finally {
			this.unmask();
		}
	}
}
