"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
function generateProtoEntryFile(dir) {
    if (dir === void 0) { dir = (0, path_1.join)(__dirname, '../'); }
    var files = (0, fs_1.readdirSync)(dir).filter(function (f) { return f.endsWith('.ts'); });
    if (files.length === 0) {
        throw new Error('No proto generated files found in ' + dir);
    }
    var entryFilePath = (0, path_1.join)(dir, 'index.ts');
    var exports = files
        .filter(function (filename) { return !filename.includes('index'); })
        .map(function (filename) {
        var name = (0, path_1.basename)(filename, '.ts');
        return "export * from \"./".concat(name, "\";");
    })
        .join('\n');
    (0, fs_1.writeFileSync)(entryFilePath, exports);
    console.log("\u2705 Generated index.ts with ".concat(files.length, " exports"));
}
generateProtoEntryFile();
