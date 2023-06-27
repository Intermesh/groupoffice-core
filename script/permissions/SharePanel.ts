import { Component, ComponentEventMap, Config, comp, createComponent, radio, t, tbar } from "@intermesh/goui";

export class SharePanel extends Component {
  constructor() {
    super()

    this.title = t("Permissions");

    this.items.add(

      tbar({},        
        radio({
          name: "filter",
          type: "button",
          value: "groups",
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
        })
        
      )
    )
  }
}


/**
 * Shorthand function to create {@see SharePanel}
 *
 * @param config
 * @param items
 */
export const sharepanel = (config?: Config<SharePanel, ComponentEventMap<SharePanel>>) => createComponent(new SharePanel(), config);