/*\
title: $:/plugins/yaml-frontmattered-markdown/startup.js
type: application/javascript
module-type: startup

Title, stylesheet and page rendering

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "frontmatterer";
exports.platforms = ["node"];
exports.after = ["startup"];
exports.synchronous = true;

/*
// Default story and history lists
var PAGE_TITLE_TITLE = "$:/core/wiki/title";
var PAGE_STYLESHEET_TITLE = "$:/core/ui/PageStylesheet";
var PAGE_TEMPLATE_TITLE = "$:/core/ui/RootTemplate";

// Time (in ms) that we defer refreshing changes to draft tiddlers
var DRAFT_TIDDLER_TIMEOUT_TITLE = "$:/config/Drafts/TypingTimeout";
var THROTTLE_REFRESH_TIMEOUT = 400;

 */
exports.startup = function() {
	$tw.utils.each($tw.wiki.filterTiddlers("[type[text/x-markdown]]"),function(item) {
		const markdownTiddler = $tw.wiki.getTiddler(item);
		const fields = $tw.utils.deepCopy(markdownTiddler.fields);
		//fields["#wiki-rel-title"] = fields.title.substring(($tw.boot.wikiPath+"/tiddlers/").length);
		// SEE https://regex101.com/r/60KP75/2 (DELETE: https://regex101.com/delete/mz5TYrHsDVmCPg1ZUcTJIDSv)
		const match = markdownTiddler.fields.text.match(/^(-{3}(?:\r\n|\r|\n)(.*?)(?:\r\n|\r|\n)-{3}(?:\r\n|\r|\n)?)?(.*)/ms);
		if(match && match[2]) {
			fields.text = match[3];
			//$tw.wiki.addTiddler(new $tw.Tiddler(markdownTiddler));
			const newTiddler = new $tw.Tiddler(deserializeYAMLFrontmatterComment(match, fields));
			$tw.wiki.addTiddler(newTiddler);
		}
	});
};

	var deserializeYAMLFrontmatterComment = function(match,fields) {
		//read only property-names and store-them (keep ordering, when writing back)
		// See https://regex101.com/r/YmeCHK/1 (DELETE: https://regex101.com/delete/dFGAoWkb7q8z7Ri0RcY4lM9N)
		const propertyNames = match[2].match(/^\w.*?(?=:)/gm);

		//handle multiline-props
		// SEE https://regex101.com/r/yByhLr/3 (DELETE: https://regex101.com/delete/HbIqLUi4lig7GO5Hn5fbqnPw)
		const multilinePropMatches = match[2].match(/^\w.*?$(?:(?:\r\n|\r|\n)(?=(?:\W*)?-)^(?:\W*)?-.*?$)+/gm)
		if(multilinePropMatches){
			for (const multilineProp of multilinePropMatches) {
				const lines = multilineProp.split(/(?:\r\n|\r|\n)/);
				const propName = lines[0].substring(0, multilineProp.indexOf(":")).trim();
				for (let j=0; j<propertyNames.length; j++) {
					if (propertyNames[j].match(propName)) {
						propertyNames[j] += "::list";
						break;
					}
				}
				const values = [];
				for (var i = 1; i < lines.length; i++) {
					values.push(lines[i].substring(lines[i].indexOf("-")+1).trim());
				}
				const propValue = $tw.utils.stringifyList(values).trim();
				fields[propName] = propValue;
			}
		}
		//handle single-props
		// SEE https://regex101.com/r/Hcp77a/1 (DELETE: https://regex101.com/delete/AEnuzg1It0e2qI5c2dml6bqb)
		const singlelinePropMatches = match[2].match(/(?:^\w.*?$)(?!(?:\W*)?-)/gm)
		if(singlelinePropMatches){
			for (const singlelineProp of singlelinePropMatches) {
				const propName = singlelineProp.substring(0, singlelineProp.indexOf(":")).trim();
				const propValue = singlelineProp.substring(singlelineProp.indexOf(":")+1).trim();
				if(propValue.startsWith("[") && propValue.endsWith("]")){
					//single-line list (e.g. [a, "b", c])
					const values = propValue.substring(1, propValue.length - 1).split(",");
					const valuesList = [];
					for (let value of values) {
						value = value.trim();
						if(value.startsWith("\"") || value.startsWith("'")){
							value = value.substring(1, value.length - 1).trim();
						}
						valuesList.push(value);
					}
					for (let j=0; j<propertyNames.length; j++) {
						if (propertyNames[j].match(propName)) {
							propertyNames[j] += "::list";
							break;
						}
					}
					const propValues = $tw.utils.stringifyList(valuesList);
					fields[propName] = propValues;
				}else {
					fields[propName] = propValue;
				}
			}
		}
		fields["$yaml-frontmatter-fields$"] = propertyNames.join(" ");
		fields.type = "text/x-frontmattered-markdown";

		return fields;
	};

})();
