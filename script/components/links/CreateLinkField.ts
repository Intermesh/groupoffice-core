import {
	AutocompleteChips,
	Config,
	createComponent,
	DataSourceForm,
	DataSourceStore,
	menu,
	t,
	Table
} from "@intermesh/goui";
import {linkDS} from "../../model/Link";
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
		})

		this.on("render", () => {
			const f = this.findAncestorByType(DataSourceForm);
			if(!f) {
				return;
			}
			f.on("save", () => {

				this.value.forEach((v:any) => {
					void linkDS.create({
						fromId: f.currentId,
						fromEntity: f.dataSource.id,
						toId: v.entityId,
						toEntity: v.entityName
					})
				});

			}, {unshift: true});
		})
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