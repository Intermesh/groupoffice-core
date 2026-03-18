import {AbstractSettingsPanel} from "./AbstractSettingsPanel";
import {t} from "@intermesh/goui";
import {settingsPanels} from "./SettingsWindow";
import {SharePanel, sharepanel} from "../../permissions";
import {modules} from "../../Modules";
import {User} from "../../auth";

settingsPanels.add(class VisibleTo extends AbstractSettingsPanel {
	declare sharePanel: SharePanel
	constructor() {
		super("visibleto", t("Visible to"), "visibility");
		const rights = modules.get("core", "core")!.userRights;

		this.items.add(
				this.sharePanel = sharepanel({
					name:'personalGroup.acl',
					levels:[],
					disabled: !rights.mayChangeUsers,
				})

		);
		//this.sharePanel.fitParent = true;
	}

	async load(user: User): Promise<any> {
		this.sharePanel.setEntity("Group", user.personalGroup.id);
		return super.load(user);
	}
});