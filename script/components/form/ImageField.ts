import {Avatar, avatar, browser, btn, comp, Config, createComponent, Field, t, tbar} from "@intermesh/goui";
import {client} from "../../jmap/index.js";

export class ImageField extends Field {
	private avatar: Avatar;

	constructor() {
		super();

		this.cls = "image-field";

		this.items.add(

			comp({cls: "image-field-container"},

				this.avatar = avatar({
					cls: "large"
				}),

				tbar({},
					btn({
						icon: "browse",
						title: t("Browse"),
						handler: async () => {
							const files = await browser.pickLocalFiles(false, false, "image/*");

							this.mask();
							try {
								const blobs = await client.uploadMultiple(files);
								this.value = blobs[0].id;
							}finally {
								this.unmask();
							}
						}
					}),
					btn({
						icon: "clear",
						title: t("Clear"),
						handler: button => {
							this.value = "";
						}
					})
				)
			)
		)
	}

	protected internalSetValue(v:string|undefined) {
		this.avatar.backgroundImage = v ? client.downloadUrl(v) : undefined;
	}

	protected renderControl() {

	}
}


/**
 * Shorthand function to create {@link ImageField}
 *
 * @param config
 */
export const imagefield = (config?: Config<ImageField>) => createComponent(new ImageField(), config);
