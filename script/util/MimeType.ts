import {MaterialIcon} from "@intermesh/goui";

export class MimeType {
	public static icon(fileName: string): MaterialIcon
	{
		const parts = fileName.split("."),
			extension = parts[parts.length - 1].toLowerCase();
		let i: MaterialIcon = "attachment";
		// Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types#mime_sniffing - Amend as needed / wanted
		const imgExtensions = ["apng","bmp", "gif", "jpg", "jpeg", "png", "svg", "webp"];
		const audioExtensions = ["aac","flac","mid", "mp3","oga","ogg","opus","wav", "weba"];
		const videoExtensions = ["avi","mpeg","mp4", "ogv", "webm"];
		const spreadsheetExtensions = ["csv","ods", "xls", "xlsx"];
		const documentExtensions = ["doc", "odt", "docx", "rtf"];
		const presentationExtensions = ["odp","ppt", "pptx"];
		const textExtensions = ["txt"];
		const archiveExtensions = ["bz","bz2","gz","rar","tar","zip", "7z"];
		const fontExtensions = ["eot","otf","ttf","woff","woff2"]
		if(extension === "pdf") {
			i = "picture_as_pdf";
		} else if (imgExtensions.includes(extension)) {
			i = "image";
		} else if(audioExtensions.includes(extension)) {
			i = "audio_file";
		} else if(videoExtensions.includes(extension)) {
			i = "video_file";
		} else if(spreadsheetExtensions.includes(extension)) {
			i = "table";
		} else if (documentExtensions.includes(extension)) {
			i = "wysiwyg";
		} else if(presentationExtensions.includes(extension)) {
			i = "slide_library";
		} else if(textExtensions.includes(extension)) {
			i = "article"
		} else if(archiveExtensions.includes(extension)) {
			i = "archive";
		} else if(fontExtensions.includes(extension)) {
			i = "font_download";
		}

		return i;

	}
}