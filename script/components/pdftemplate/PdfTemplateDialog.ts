import {FormWindow} from "../FormWindow";
import {
	arrayfield, ArrayUtil, btn,
	checkbox,
	comp,
	ContainerField, containerfield,
	fieldset,
	Notifier,
	numberfield,
	select, Sortable,
	t, tbar,
	textarea,
	textfield
} from "@intermesh/goui";
import {filebutton, languagefield} from "../form";

export class PdfTemplateDialog extends FormWindow {
	constructor() {
		super("PdfTemplate");
		this.title = t("PDF template", "core", "core");

		this.collapsible = false,
			this.maximizable = true;
		this.resizable = true;
		this.closable = true;
		this.width = 1000;
		this.height = 800;

		const blocksFld = arrayfield({
			name: "blocks",
			listeners: {
				render: ({target}) => {
					const sortable = new Sortable(target, ".group");
					sortable.on("sort", ({toIndex, fromIndex}) => {
						target.value = ArrayUtil.move(target.value, fromIndex, toIndex);
					})
				}
			},
			/**
			 * This function is called to create form fields for each array item.
			 * Typically, a container field will be used.
			 */
			buildField: () => {
				const field = containerfield({
						cls: "group",
					},
					comp({
							cls: "hbox gap",
							flex: 1
						},
						comp({
								cls: "vbox gap",
								width: 200,
							},
							numberfield({
								decimals: 0,
								name: "x",
								label: "x"
							}),
							numberfield({
								decimals: 0,
								name: "y",
								label: "y"
							}),
							numberfield({
								name: "width",
								label: t("Width"),
								min: 0,
								decimals: 0
							}),
							numberfield({
								name: "height",
								label: t("Height"),
								min: 0,
								decimals: 0
							}),
							select({
								label: t("Align"),
								name: "align",
								value: "L",
								options: [
									{value: "L", name: t("Left")},
									{value: "C", name: t("Center")},
									{value: "R", name: t("Right")},
									{value: "J", name: t("Justify")}
								]
							}),
							select({
								label: t("Type"),
								name: "type",
								value: "html",
								options: [
									{value: "html", name: "HTML"},
									{value: "text", name: t("Text")}
								]
							})
						),
						comp({cls: "fit", flex: 1},
							textarea({
								name: "content",
								label: t("Content"),
								height: 400,
								required: true
							})
						),
						comp({
								cls: "hbox gap",
								width: 100,
							},
							btn({
								icon: "delete",
								title: "Delete",
								handler: (btn) => {
									field.remove();
								}
							}),

							btn({
								cls: "handle",
								icon: "drag_handle",
								title: "Sort",
								listeners: {
									render: ({target}) => {
										target.el.addEventListener("mousedown", () => {
											const row = target.findAncestorByType(ContainerField)!
											row.el.draggable = true;
										});
										target.el.addEventListener("mouseup", () => {
											const row = target.findAncestorByType(ContainerField)!
											row.el.draggable = false;
										});
									}
								}
							})
						)
					)
				);
				return field;
			}
		});

		const cmp = comp({
			cls: "scroll fit",
			title: t("Blocks")
		});
		this.cards.items.insert(1, cmp);
		cmp.items.add(fieldset({},
			blocksFld,
			tbar({cls: "border-top"},
				"->",
				btn({
					icon: "add",
					cls: "primary",
					handler: () => {
						blocksFld.addValue({});
					}
				})
			)
		));

		this.generalTab.items.add(
			fieldset({},
				textfield({
					name: "name",
					required: true,
					label: t("Name"),
				}),
				languagefield({
					required: true
				})
			),
			comp({cls: "hbox"},
				fieldset({
						flex: 0.5,
						legend: t("Page")
					},
					select({
						name: "pageSize",
						label: t("Page size"),
						value: "A4",
						options: [
							{value: "A4", name: "A4"},
							{value: "Letter", name: "Letter"}
						]
					}),
					select({
						name: "measureUnit",
						label: t("Measure unit"),
						value: "mm",
						options: [
							{value: "mm", name: "Milimeters"},
							{value: "in", name: "Inches"},
							{value: "pt", name: "Points"},
							{value: "cm", name: "Centimeters"}
						]
					}),
					select({
						name: "fontFamily",
						label: t('Font'),
						value: "dejavusans",
						options: [
							{value: "dejavusans", name: "DejaVu Sans"},
							{value: "freesans", name: "Freesans"},
							{value: "freemono", name: "Free mono"},
							{value: "freeserif", name: "Free serif"},
							{value: "helvetica", name: "Helvetica"},
							{value: "times", name: "Times New Roman"},
							{value: "}aefurat", name: "Arabic Furat"}
						]
					}),
					numberfield({
						name: "fontSize",
						value: 10,
						decimals: 0,
						label: t("Font size")
					}),
					checkbox({
						type: "switch",
						name: "landscape",
						label: t("Landscape")
					}),
					filebutton({
						label: t("Stationary PDF"),
						accept: "application/pdf",
						name: "stationary"
					}),
					filebutton({
						label: t("Logo"),
						accept:  "image/*",
						name: "logo"
					})
				),
				fieldset({
						flex: 0.5,
						legend: t("Margins")
					},
					numberfield({
						decimals: 0,
						name: "marginTop",
						label: t("Top"),
						value: 10
					}),
					numberfield({
						decimals: 0,
						name: "marginRight",
						label: t("Right"),
						value: 10
					}),
					numberfield({
						decimals: 0,
						name: "marginBotton",
						label: t("Bottom"),
						value: 10
					}),
					numberfield({
						decimals: 0,
						name: "marginLeft",
						label: t("Left"),
						value: 10
					})
				)
			),
			fieldset({
					flex: 1,
					legend: t("Header")
				},
				numberfield({
					name: "headerX",
					label: "x",
					value: 10,
					width: 200,
					decimals: 0
				}),
				numberfield({
					name: "headerY",
					label: "y",
					value: 10,
					width: 200,
					decimals: 0
				}),
				textarea({
					label: `${t("Header")} (HTML)`,
					name: "header"
				})
			),
			fieldset({
					flex: 1,
					legend: t("Footer")
				},
				numberfield({
					name: "footerX",
					label: "x",
					value: 10,
					width: 200,
					decimals: 0
				}),
				numberfield({
					name: "footerY",
					label: "y",
					value: 10,
					width: 200,
					decimals: 0
				}),
				textarea({
					label: `${t("Footer")} (HTML)`,
					name: "footer",
					hint: `${t("For page numbers use")}: <div style="text-align: right; width: 100%;">{{pageNumberWithTotal}}</div>;`
				})
			)
		);

		this.form.on("submit", () => {
			Notifier.success(t("Saved successfully"))
		});
		this.form.on("load", ({data})=> this.title = data.name);
	}
}