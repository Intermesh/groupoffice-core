import {FormWindow} from "../components/index.js";
import {a, comp, fieldset, Format, p, t, textfield, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {LegacyApi} from "../LegacyApi";
import {modules} from "../Modules";

export class AboutWindow extends Window {
	constructor() {
		super();

		const la = new LegacyApi("core", "about");

		if (client.user.isAdmin) {

		}

		this.title = t("About");
		this.cls = "about";

		this.items.add(
			comp({cls: "about-groupoffice-logo"}),

			p({
					html: t("Version: {version}<br/>Copyright &copy; 2003-{current_year}, {company_name}<br/>All rights reserved.")
						.replace("{version}", client.session!.version)
						.replace("{current_year}", (new Date).getFullYear())
						.replace("{company_name}", "Intermesh")
				}
			),

			a({href: "https://www.group-office.com", target: "_blank"})
		);

		this.on("render", async () => {
			if (!client.user.isAdmin) {
				return;
			}
			const coreModule = modules.get("core", "core"),
				s = coreModule!.settings;
			console.log(s);

			const resp = await la.call() as any;
			if (resp.data && resp.data.has_usage) {
				this.items.insert(2, fieldset({
						title: t("This instance is using")
					},
					textfield({
						label: t("Users"),
						readOnly: true,
						value: resp.data.users
					}),
					textfield({
						label: t("Files"),
						readOnly: true,
						value: `${Format.fileSize(s.fileStorageUsage)} / ${resp.data.quota ? Format.fileSize(resp.data.quota): "-"}`
					}),
					textfield({
						label: t("E-mail"),
						readOnly: true,
						value: s.mailboxUsage ? Format.fileSize(s.mailboxUsage) : '-'
					}),
					textfield({
						label: t("Total"),
						readOnly: true,
						value: Format.fileSize((s.mailboxUsage+s.databaseUsage + s.fileStorageUsage))
					}),
					textfield({
						label: t("Date"),
						readOnly: true,
						value: s.cronLastRun ? Format.smartDateTime(s.cronLastRun) : t("Never")
					})
				));
			}
		});

	}
}