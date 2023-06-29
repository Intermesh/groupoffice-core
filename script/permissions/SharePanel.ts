import {
  Component,
  ComponentEventMap,
  Config,
  comp,
  createComponent,
  radio,
  t,
  tbar,
  searchbtn,
  Table, datasourcestore, column, DataSourceStore, checkbox, avatar, select, Field, store, small
} from "@intermesh/goui";
import {FilterCondition, jmapds} from "../jmap";

class GroupTable extends Table<DataSourceStore> {
  value: any;
  constructor() {
    super(
      datasourcestore({
        dataSource: jmapds("Group"),

        queryParams:{
          filter: {
            hideUsers: true,
            hideGroups: false
          },

        },

        sort: [{
          property: "name"
        }]
      }),
      [
        column({
          header: t("Name"),
          id: "name",
          renderer: async (columnValue, record, td, table, storeIndex) => {

            const first = record.users.slice(0, 3);

            const users = await jmapds("User").get(first);


            let memberStr = users.list.map(u => u.displayName).join(", ");

            const more = record.users.length - 3;

            if(more > 0) {
              memberStr += t(" and {count} more").replace('{count}', more);
            }

            return comp({cls: "hbox"},
              avatar({
                displayName: record.name,
                backgroundImage: record.avatarId ? go.Jmap.downloadUrl(record.avatarId) : undefined
              }),
              comp({flex: 1},
                comp({text: record.name}),
                small({text: memberStr})
              )
            )
          }
        }),

        column({
          id:"level",
          width: 120,
          header: t("Level"),
          renderer: (columnValue, record, td, table, storeIndex) => {
            return select({
              value: this.value ? this.value[record.id] ?? undefined : undefined,
              options: [{
                value: "",
                name: ""
              },{
                value: 10,
                name: t("Read")
              },{
                value: 20,
                name: t("Create")
              },{
                value: 30,
                name: t("Write")
              },{
                value: 40,
                name: t("Delete")
              },{
                value: 50,
                name: t("Manage")
              }],
              listeners:{
                change:(field, newValue, oldValue) => {
                  this.value[record.id] = newValue ? newValue : null;
                }
              }
            });
          }
        })

      ]);

    this.fitParent = true;
  }

  setEntity(name:string, id:string) {
    this.store.queryParams.filter!.inAcl = {entity: name, id: id};
  }
}


export class SharePanel extends Field {
  private readonly groupTable: GroupTable;
  constructor() {
    super("div");

    this.name = "acl";
    this.cls = "vbox";

    this.title = t("Permissions");

    this.groupTable = new GroupTable();

    this.items.add(

      tbar({},        
        radio({
          type: "button",
          value: "groups",
          listeners: {

            change: (field, newValue, oldValue) => {
              const f = this.groupTable.store.queryParams.filter!;

              switch(newValue) {
                case "both":
                  f.hideUsers = false;
                  f.hideGroups = false;
                  break;

                case "users":
                  f.hideUsers = false;
                  f.hideGroups = true;
                  break;

                case "groups":
                  f.hideUsers = true;
                  f.hideGroups = false;
                  break;

              }

              this.groupTable.store.load();
            }
          },
          options:[
            {
              text: t("All"),
              value: "both"
            },
            {
              text: t("Users"),
              value: "users"
            },
            {
              text: t("Groups"),
              value: "groups"
            }
          ]
        }),
        "->",
        searchbtn({
          listeners: {
            input: (sender, text) => {
              // (this.noteGrid.store.queryParams.filter as FilterCondition).text = text;
              // void this.noteGrid.store.load();
            }
          }
        }),
        
      ),

      comp({cls: "scroll fit", flex: 1},
        this.groupTable
      )
    )
  }

  public setEntity(name:string, id:string) {
    this.groupTable.setEntity(name, id);
  }

  public load() {
    this.groupTable.store.load();
  }

  protected internalSetValue(v: any, old: any) {
    this.groupTable.value = v;
    return super.internalSetValue(v, old);
  }
}


/**
 * Shorthand function to create {@see SharePanel}
 *
 * @param config
 * @param items
 */
export const sharepanel = (config?: Config<SharePanel, ComponentEventMap<SharePanel>>) => createComponent(new SharePanel(), config);