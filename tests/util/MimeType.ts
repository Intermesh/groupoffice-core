import {expect} from "chai";
import {describe} from "mocha";
import {MimeType} from "../../script/util/MimeType.js";

describe('MimeType class', () => {
	describe("icon", () => {
		const icons: [string, string][] = [
			["report.pdf", "picture_as_pdf"],
			["photo.JPG", "image"],
			["song.mp3", "audio_file"],
			["movie.mp4", "video_file"],
			["budget.xlsx", "table"],
			["letter.docx", "wysiwyg"],
			["slides.odp", "slide_library"],
			["notes.txt", "article"],
			["backup.tar.gz", "archive"],
			["font.woff2", "font_download"],
			["unknown.xyz", "attachment"],
			["no-extension", "attachment"]
		];

		icons.forEach(([fileName, icon]) => {
			it(`Gives "${icon}" for "${fileName}"`, () => {
				expect(MimeType.icon(fileName)).to.equal(icon);
			});
		});
	});
});
