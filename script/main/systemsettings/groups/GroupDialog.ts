import {FormWindow} from "../../../components/index.js";
import {fieldset, HiddenField, hiddenfield, t, textfield} from "@intermesh/goui";
import {GroupUserTable} from "./GroupUserTable.js";

export class GroupDialog extends FormWindow {
	private groupUserTbl: GroupUserTable;
	private usersField: HiddenField;
	constructor() {
		super("Group");

		this.title = t("Group");

		this.height = 800;
		this.generalTab.cls = "vbox fit";

		this.generalTab.items.add(

			fieldset({},
				textfield({label: "Name", name: "name"})
			),
			this.usersField = hiddenfield({name: "users"}),

			fieldset({
				legend: t("Members"),
				cls:"scroll",
				flex: 1
			},

				this.groupUserTbl = new GroupUserTable(this.usersField)

			)


		)

		this.addSharePanel();

		this.on("ready", (ev) => {
			// this.groupUserTbl.selectedIds = this.form.value?.users ?? [];
			this.groupUserTbl.store.setFilter('sort', {'groupMember' : this.form.currentId});
			this.groupUserTbl.store.load();
		})
	}
}