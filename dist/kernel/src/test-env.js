"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
const envPath = path_1.default.join(__dirname, '../../../.env');
console.log('Target .env path:', envPath);
const result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.log('Dotenv error:', result.error.message);
}
else {
    console.log('Dotenv loaded successfully');
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
}
//# sourceMappingURL=test-env.js.map