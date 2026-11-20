import {checkbox, CheckboxField, comp, fieldset, t} from "@intermesh/goui";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {moduleDS, modules} from "../../Modules.js";
import {entities} from "../../Entities.js";

/**
 * System settings page to leave entities out of the global search.
 *
 * Saves the core setting "searchExcludedEntities". The server removes the search keywords of excluded entities.
 */
class Search extends AbstractSystemSettingsPanel {

	private readonly checkboxes: Record<string, CheckboxField> = {};
	private originalExcluded?: string;

	constructor() {
		super("search", t("Search"), "search");

		this.cls = "fit scroll";

		const fs = fieldset({
				width: 600,
				legend: t("Show in search")
			},
			comp({
				tagName: "p",
				text: t("Uncheck the items that you don't want to find in the search at the top. Their keywords are removed from the search index, which saves space and makes searching faster. Existing links to these items keep working, but you can't search for them when you create a link.")
			}),
			comp({
				tagName: "p",
				text: t("When you check an item again, run \"Update search index\" in Tools to add it to the search index again.")
			})
		);

		for (const name of this.getSearchableEntityNames()) {
			this.checkboxes[name] = checkbox({
				label: entities.get(name).title,
				value: true
			});
			fs.items.add(this.checkboxes[name]);
		}

		this.items.add(fs);
	}

	/**
	 * Entities that are in the search index have a link configuration. Some entities have more than one, like
	 * Contact and Organization, so take the unique entity names sorted by title.
	 */
	private getSearchableEntityNames(): string[] {
		const names = [...new Set(entities.getLinkConfigs().map(cfg => cfg.entity))];
		return names.sort((a, b) => entities.get(a).title.localeCompare(entities.get(b).title));
	}

	private getExcluded(): string[] {
		return Object.keys(this.checkboxes).filter(name => !this.checkboxes[name].value);
	}

	async load(): Promise<any> {
		const excluded: string[] = modules.get("core", "core")?.settings.searchExcludedEntities ?? [];
		for (const name in this.checkboxes) {
			this.checkboxes[name].value = !excluded.includes(name);
		}
		this.originalExcluded = this.getExcluded().join(" ");
	}

	async save(): Promise<any> {
		const excluded = this.getExcluded(), core = modules.get("core", "core");
		if (!core || this.originalExcluded === undefined || excluded.join(" ") === this.originalExcluded) {
			return;
		}

		await moduleDS.update(core.id, {settings: {searchExcludedEntities: excluded}});
		this.originalExcluded = excluded.join(" ");
	}
}

systemSettingsPanels.add(Search);
