import {AbstractSettingsPanel} from "./AbstractSettingsPanel";
import {containerfield, datasourceform, t} from "@intermesh/goui";
import {userSettingsPanels} from "./UserSettingsWindow.js";
import {SharePanel, sharepanel} from "../../permissions";
import {modules} from "../../Modules";
import {User, userDS} from "../../auth";

userSettingsPanels.add(class VisibleTo extends AbstractSettingsPanel {
	private sharePanel: SharePanel
	constructor() {
		super("visibleto", t("Visible to"), "visibility");
		const rights = modules.get("core", "core")!.userRights;

		this.cls = "fit";
		this.items.add(
			this.form = datasourceform({dataSource: userDS, cls: "fit"},
				containerfield({
					cls: "fit",
					name: "personalGroup"
				},
					this.sharePanel = sharepanel({
						cls: "fit",
						name:'acl',
						levels:[{value: "",name: ""},	{value: 10,name: t("Yes")}],
						disabled: !rights.mayChangeUsers
					})
				)
			)
		);

		this.on("show", () => {
			if(this.user) {
				this.sharePanel.load();
			}
		})
	}

	async load(user: User): Promise<any> {
		this.sharePanel.setEntity("Group", user.personalGroup.id);

		return super.load(user);
	}
});