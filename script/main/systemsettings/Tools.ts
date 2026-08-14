import {btn, comp, h2, t, tbar} from "@intermesh/goui";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {AbstractModuleSystemSettingsPanel} from "./AbstractModuleSystemSettingsPanel.js";
import {modules} from "../../Modules.js";

class SystemSettingsTools extends AbstractModuleSystemSettingsPanel {
	constructor() {
		super("tools", t("Tools"), "core", "core", "tools_wrench");

		this.cls = "fit vbox scroll";

		const buttons = [
			this.buildButton("/install/gotest.php", t("System check")),
			this.buildButton(GO.url("maintenance/checkDatabase"), t("Database check")),
			this.buildButton(GO.url("maintenance/buildSearchCache"), t("Update search index")),
			this.buildButton(GO.url("maintenance/buildSearchCache", {reset: 1}), t("Update search index (Complete rebuild)")),
			this.buildButton(GO.url("maintenance/buildPrincipals"), t("Rebuild principals")),
			this.buildButton(GO.url("maintenance/removeDuplicates"), t("Remove duplicate contacts and events")),
		];

		if (modules.isAvailable("legacy", "files")) {
			buttons.push(this.buildButton(GO.url("files/folder/syncFileSystem"), t("Sync file system")));
		}

		if (modules.isAvailable("legacy", "filesearch")) {
			buttons.push(this.buildButton(GO.url("filesearch/filesearch/sync"), t("Update filesearch index")));
		}

		if (modules.isAvailable("community", "calendar")) {
			buttons.push(this.buildButton(GO.url("calendar/calendar/truncateHolidays"), t("Clear calendar holiday cache")));
		}

		this.items.add(
			tbar({},
				h2("Admin tools")
			),
			comp({
					cls: "vbox pad gap",
					width: 400
				},
				...buttons
			)
		)
	}

	private buildButton(url: string, label: string) {
		return btn({
			cls: "filled basic",
			handler: () => {
				window.open(url, '_blank');
			},
			html: `<span style="display:flex; align-items:center; justify-content:space-between; width:100%;"> ${label} <i class="icon">chevron_right</i></span>`
		})
	}
}

systemSettingsPanels.add(SystemSettingsTools);