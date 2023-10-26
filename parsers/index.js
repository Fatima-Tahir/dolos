module.exports.c = require("./build/Release/tree_sitter_c_binding");
module.exports.c.nodeTypeInfo = require("./c/src/node-types.json");

module.exports.bash = require("./build/Release/tree_sitter_bash_binding");
module.exports.bash.nodeTypeInfo = require("./bash/src/node-types.json");

module.exports.java = require("./build/Release/tree_sitter_java_binding");
module.exports.java.nodeTypeInfo = require("./java/src/node-types.json");

