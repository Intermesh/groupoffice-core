import {
	AutocompleteChips,
	Config,
	createComponent,
	DataSourceStore,
	menu,
	t,
	Table
} from "@intermesh/goui";
import {SelectSearchPanel} from "./SelectSearchPanel";


export class CreateLinkField extends AutocompleteChips<Table<DataSourceStore>> {

	private selectSearchPanel: SelectSearchPanel;

	constructor() {

		const selectLinkPanel = new SelectSearchPanel(false);
		super(selectLinkPanel.resultTable);

		this.selectSearchPanel = selectLinkPanel;

		this.label = t("Create links")

		this.chipRenderer =  async (chip, value) => {
			let search:any;
			if(value.searchId) {
				search = await this.selectSearchPanel.resultTable.store.dataSource.single(value.searchId);
			} else {

				value.searchId = (await this.selectSearchPanel.resultTable.store.dataSource.query({
					filter: {
						entities: [{name: value.entityName}],
						entityId: value.entityId
					}
				})).ids[0]
				search = await this.selectSearchPanel.resultTable.store.dataSource.single(value.searchId);
			}
			chip.text = search.name;
		}

		this.pickerRecordToValue = (field, record) => {
			return {searchId: record.id, entityId: record.entityId, entityName: record.entity};
		}

		this.on("autocomplete" , ({input}) => {
			this.selectSearchPanel.resultTable.store.setFilter("autocomplete", {text: input});
			void this.selectSearchPanel.resultTable.store.load();
		});

	}

	protected createMenu() {
		return menu({
			cls: "goui-dropdown hbox",
			style: {padding: "0"},
			removeOnClose: false,
			height: 400,
			width: 600
		},
			this.selectSearchPanel
		);
	}
}

export const createlinkfield = (config?: Config<CreateLinkField>) => createComponent(new CreateLinkField(), config);