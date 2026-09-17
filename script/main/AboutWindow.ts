import {FormWindow} from "../components/index.js";
import {a, comp, fieldset, Format, p, t, textfield, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {LegacyApi} from "../LegacyApi";

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
						value: `${Format.fileSize(resp.data.file_storage_usage)} / ${resp.data.quota ? Format.fileSize(resp.data.quota): "-"}`
					}),
					textfield({
						label: t("E-mail"),
						readOnly: true,
						value: resp.data.mailbox_usage ? Format.fileSize(resp.data.mailbox_usage) : '-'
					}),
					textfield({
						label: t("Total"),
						readOnly: true,
						value: resp.data.total_usage
					}),
					textfield({
						label: t("Date"),
						readOnly: true,
						value: resp.data.date ? Format.smartDateTime(resp.data.date) : t("Never")
					})
				));
			}
		});

	}
}