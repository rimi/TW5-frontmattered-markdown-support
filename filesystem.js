/*\
title: $:/plugins/yaml-frontmattered-markdown/filesystem.js
type: application/javascript
module-type: utils-node

Filesystem-Delegate for supporting YAML-frontmattered markdown

\*/
(function(){

// store the previous save-function for usage in other cases than frontmattered-markdown
const origSaveTiddlerToFile = $tw.utils.saveTiddlerToFile;

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var fs = require("fs"),
	path = require("path");

/*
Save a tiddler to a file described by the fileInfo:
	filepath: the absolute path to the file containing the tiddler
	type: the type of the tiddler file (NOT the type of the tiddler)
	hasMetaFile: true if the file also has a companion .meta file
*/
exports.saveTiddlerToFile = function(tiddler,fileInfo,callback) {

	if(fileInfo.type === "text/x-frontmattered-markdown" && tiddler.fields["$yaml-frontmatter-fields$"]) {
		$tw.utils.createDirectory(path.dirname(fileInfo.filepath));

		var typeInfo = $tw.config.contentTypeInfo[tiddler.fields.type || "text/plain"] || {encoding: "utf8"};
		const fields4Frontmatter = $tw.utils.parseStringArray(tiddler.fields["$yaml-frontmatter-fields$"], false);
		const fieldValues = [];
		for(const frontmatterField of fields4Frontmatter){
			if(frontmatterField.endsWith("::list")){
				const tiddlerField = frontmatterField.substring(0, frontmatterField.length - "::list".length);
				const parsedFields = $tw.utils.parseStringArray(tiddler.fields[tiddlerField], false) || [];
				let propertyString = tiddlerField + ": \n";
				for (var i = 0; i < parsedFields.length; i++) {
					propertyString += "- " + parsedFields[i];
					if(i < parsedFields.length-1) {
						propertyString += "\n";
					}
				}
				if(parsedFields.length === 0) propertyString += "-"
				fieldValues.push(propertyString);
			}else{
				fieldValues.push(frontmatterField + ": " + (tiddler.fields[frontmatterField] ? tiddler.fields[frontmatterField] : ""));
			}
		}

		const markdownPayload = "---\n" + fieldValues.join("\n\n") + "\n---\n" + tiddler.fields.text;
		fs.writeFile(fileInfo.filepath, markdownPayload, typeInfo.encoding, function (err) {
			if (err) {
				return callback(err);
			}
			return callback(null, fileInfo);
		});
	}else{
		origSaveTiddlerToFile(tiddler,fileInfo,callback);
	}
}

})();
