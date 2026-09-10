import {FormWindow} from "../components/index.js";
import {a, comp, p, t, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";

export class AboutWindow extends Window {
	constructor() {
		super();

		 this.title = t("About");
		 this.cls = "about";

		this.items.add(
			comp({cls: "about-groupoffice-logo"}),

			p({
					html: t("Version: {version}<br/>Copyright (c) 2003-{current_year}, {company_name}<br/>All rights reserved.")
						.replace("{version}", client.session!.version)
						.replace("{current_year}", (new Date).getFullYear())
						.replace("{company_name}", "Intermesh")
				}
			),

			a({href: "https://www.group-office.com", target: "_blank"})

		)
	}
}