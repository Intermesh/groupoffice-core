/**
 * @license https://github.com/Intermesh/goui/blob/main/LICENSE MIT License
 * @copyright Copyright 2023 Intermesh BV
 * @author Merijn Schering <mschering@intermesh.nl>
 */

import {comp, Component, Config, createComponent, t, win} from "@intermesh/goui";
import {client} from "./Client.js";

/**
 * Image component
 *
 * Uses the fetch API to fetch the image with an Authorization header and creates an objectURL using URL.createObjectURL()
 */
export class Image extends Component {

	public blobId = "";

	constructor() {
		super("img");
	}

	private static cache: Record<string, Promise<any>> = {};

	private static defaultSrc = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';


	protected internalRender(): HTMLElement {
		const el = super.internalRender() as HTMLImageElement;

		el.src = Image.defaultSrc;

		if(this.blobId) {
			this.setBlobId(this.blobId);
		}

		return el;
	}

	public setBlobId(blobId:string) {
		this.blobId = blobId;
		client.getBlobURL(this.blobId).then( src => {
			(<HTMLImageElement> this.el).src = src
		} )
			.catch( console.error );
	}

	public static replace(html: string) {
		const c = comp({
			html: html
		});

		Image.replaceImages(c.el);

		return c;
	}

	/**
	 * Open a window with the large image when an image inside the element is clicked
	 *
	 * @param el
	 */
	public static enableZoom(el: HTMLElement) {
		el.classList.add("image-zoom");
		el.addEventListener("click", (e) => {
			if (e.target && (e.target as HTMLElement).tagName == "IMG") {
				Image.showWindow(e.target as HTMLImageElement);
			}
		});
	}

	/**
	 * Show the image in a window
	 *
	 * @param img
	 */
	public static showWindow(img: HTMLImageElement) {
		const imageWin = win({
				width: window.innerWidth - 50,
				height: window.innerHeight - 50,
				maximized: false,
				maximizable: true,
				resizable: true,
				modal: true,
				title: img.alt || t("Image"),
			},
			comp({
				flex: 1,
				itemId: "img-cont",

				style: {
					alignItems: "center",
					justifyContent: "center"
				},
				listeners: {
					beforerender: ({target}) => {
						const i = img.cloneNode() as HTMLImageElement;
						i.removeAttribute("style");
						i.style.height = "100%";
						i.style.width = "100%";
						i.style.objectFit = "contain";
						target.el.appendChild(i);
					}
				}
			})
		);

		imageWin.show();
	}

	/**
	 * Replaces all img tags with a blob ID source from group-office with an data URL
	 *
	 * @param el
	 * @return Promise that resolves when all images are fully loaded
	 */
	public static replaceImages(el:HTMLElement) {

		const promises:Promise<any>[] = [];
		el.querySelectorAll("img").forEach((img:HTMLImageElement) => {

			let blobId = img.dataset.blobId;
			if(!blobId) {
				//match blob= in img src attributes. For example emails have this from the email module.
				const regex = new RegExp(/blob=([^">'&?]*)/);
				const matches = regex.exec(img.src);
				if(matches && matches[1]) {
					blobId = matches[1];
				}
			}

			if(blobId) {
				img.dataset.blobId = blobId;
				img.src = Image.defaultSrc;

				promises.push(client.getBlobDataURL(blobId).then(src => {

					img.src = src;
				}).then(() => {
					//wait till image is fully loaded
					return new Promise(resolve => { img.onload = img.onerror = resolve; })
				}));
			}
		});

		return Promise.all(promises);
	}

}


/**
 * Shorthand function to create table
 *
 * @param config
 */
export const img = (config?:Config<Image>) => createComponent(new Image, config);