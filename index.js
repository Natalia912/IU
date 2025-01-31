const fs = require('fs')
/* Regex to validate UTF-8 encoding */

const UTF8_REGEX = /^([\x00-\x7F]|([\xC2-\xDF]|\xE0[\xA0-\xBF]|\xED[\x80-\x9F]|(|[\xE1-\xEC]|[\xEE-\xEF]|\xF0[\x90-\xBF]|\xF4[\x80-\x8F]|[\xF1-\xF3][\x80-\xBF])[\x80-\xBF])[\x80-\xBF])*$/

/* Regex to validate attributes (key="value" pairs) */
const attributeRegex = /^[a-zA-Z_:][a-zA-Z0-9_\-:.]*="[^"]*"$/;

/* Check if an array has duplicate elements */
const hasDuplicates = (arr) => {
  let sorted_arr = arr.slice().sort();
  let results = [];
  for (let i = 0; i < sorted_arr.length - 1; i++) {
    if (sorted_arr[i + 1] == sorted_arr[i]) {
      results.push(sorted_arr[i]);
    }
  }
  return results.length > 0;
}

const validateAttributes = (attrParts, tagName) => {
  /* Validate attributes */
  attrParts.forEach((attr) => {
    /* Check if attribute has correct structure and format */
    if (!attributeRegex.test(attr)) {
      throw new Error(`Malformed XML: Invalid attribute '${attr}' in tag <${tagName}>.`);
    } 
    /* Check if attribute has correct encoding */
    else if (!UTF8_REGEX.test(attr)) {
      throw new Error(`Malformed XML: Invalid attribute '${attr}' in tag <${tagName}>. Unsupported character encoding.`);
    }
  })
  /* Check if there are duplicate attributes */
  if (hasDuplicates(attrParts)) {
    throw new Error(`Malformed XML: Duplicate attributes in tag <${tagName}>.`);
  }
}

/* Accepts an XML string and validates the attributes */
const validateXML = (xml) => {
  /* tagStack is for checking opening and closing tags */
  const tagStack = [];

  const parseNode = (xml) => {
    if(xml.includes('<')) {
      const tagStart = xml.indexOf("<");
      const tagEnd = xml.indexOf(">");

      /* If there's no closing `>`, throw an error */
      if (tagEnd === -1) {
        throw new Error("Malformed XML: Missing closing '>' for a tag.");
      }

      /* Process XML header */
      if (xml[tagStart + 1] === "?") {
        const tagEnd = xml.indexOf("?>");
        const tagContent = xml.slice(tagStart + 2, tagEnd).trim();
        const [name, ...attrParts] = tagContent.split(" ");
        const tagName = name.trim();
        validateAttributes(attrParts, tagName)
        return parseNode(xml.slice(tagEnd + 2))
      }

      const tagContent = xml.slice(tagStart + 1, tagEnd).trim();
      /* Handle closing tags */
      if (tagContent.startsWith("/")) {
        const closingTag = tagContent.slice(1).trim();
        if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== closingTag) {
          throw new Error(`Malformed XML: Mismatched or unexpected closing tag </${closingTag}>.`);
        }
        tagStack.pop(); /* Pop the matching opening tag */
        return parseNode(xml.slice(tagEnd + 1)) /* Continue parsing the rest of the XML by calling the function recursively */
      }

      /* Handle self-closing tags */
      const isSelfClosing = tagContent.endsWith("/");

      /* Extract tag name and validate attributes */
      let tagName = "";
      if (isSelfClosing) {
        const [name, ...attrParts] = tagContent.slice(0, -1).trim().split(" ");
        tagName = name.trim();
        validateAttributes(attrParts, tagName)
      } else if (tagContent.includes(" ")) {
        const [name, ...attrParts] = tagContent.split(" ");
        tagName = name.trim();
        validateAttributes(attrParts, tagName)
      } else {
        tagName = tagContent;
      }

      if (!isSelfClosing) {
        tagStack.push(tagName); /* Push the tag onto the stack */
      }

      return parseNode(xml.slice(tagEnd + 1)) /* Continue parsing the rest of the XML by calling the function recursively */
    }
  }
  parseNode(xml)
}

/* 
  Loading and reading the XML file with the name 'foo.xml'
  The file should be in the same directory as this script
  The program can also be run by calling validateXVL function with the XML string as an argument 
*/
fs.readFile('foo.xml', function(err, data) {
  if (err) {
    throw err
  }
  /* Convert the buffer to a string */
  const doc = data.toString()
  try {
    validateXML(doc)
    /* If not issues are found, log that the XML attributes are valid */
    console.log('XML attributes are valid')
  } catch (e) {
    throw e
  }
})
