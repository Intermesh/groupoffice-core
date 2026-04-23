import {btn, Component, searchbtn, tbar} from "@intermesh/goui";
import {EmailTemplateTable} from "./EmailTemplateTable";
import {EmailTemplateDialog} from "./EmailTemplateDialog";
import {modules} from "../../Modules";

export class EmailTemplatePanel extends Component {
	private tbl: EmailTemplateTable;

	constructor(key: string, module: { name: string, package: string }) {
		super();
		this.tbl = new EmailTemplateTable();
		const m = modules.get(module.package, module.name);

		this.items.add(tbar({},
				"->",
				searchbtn(),
				btn({
					icon: "add",
					cls: "primary",
					handler: () => {
						const dlg = new EmailTemplateDialog();
						dlg.form.value = {
							key: key,
							moduleId: m!.id
						};
						dlg.show();

					}
				})),
			this.tbl
		);
		void this.tbl.store.setFilter('key', {key: key}).load();

		this.tbl.on("rowdblclick", ({storeIndex}) => {
			const record = this.tbl.store.get(storeIndex);
			const dlg = new EmailTemplateDialog();
			dlg.load(record!.id).then(() => dlg.show());
		});
	}
}
