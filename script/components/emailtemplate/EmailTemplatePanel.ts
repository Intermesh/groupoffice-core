import {btn, Component, searchbtn, tbar} from "@intermesh/goui";
import {EmailTemplateTable} from "./EmailTemplateTable";

export class EmailTemplatePanel extends Component {
	private tbl: EmailTemplateTable;
	constructor() {
		super();
		this.tbl = new EmailTemplateTable();

		this.items.add(tbar({},
				"->", searchbtn(), btn({
					icon: "add",
					cls: "primary",
					handler: () => {
						const dlg = new go.pdftemplate.TemplateDialog();
						dlg.setValues();
						dlg.show();

					}
				})),
			this.tbl
		);
	}
}
