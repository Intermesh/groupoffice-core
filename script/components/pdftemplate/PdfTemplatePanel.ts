import {btn, Component, searchbtn, tbar} from "@intermesh/goui";
import {PdfTemplateTable} from "./PdfTemplateTable";

export class PdfTemplatePanel extends Component {

	private module: {name: string, package: string};
	private tbl: PdfTemplateTable;
	private key: string|undefined;

	constructor(module: {name: string, package: string}, ) {
		super();
		this.module = module;

		this.tbl = new PdfTemplateTable(module);

		this.items.add(tbar({},
			"->", searchbtn(), btn({
				icon: "add",
				cls: "primary",
				handler: () => {
					const dlg = new go.pdftemplate.TemplateDialog();
					dlg.setValues({module: this.module, key: this.key});
					dlg.show();

				}
			})),
			this.tbl
		);
	}

	public setKey(key: string): void {
		this.key = key;
		this.tbl.store.setFilter("key", {key: key}).load();
	}
}