"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_NAME = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = exports.GOOGLE_CLIENT_ID = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getEnvVar(key) {
    const value = process.env[key];
    if (!value)
        throw new Error(`❌ Missing required environment variable: ${key}`);
    return value;
}
exports.PORT = process.env.PORT || '4000';
exports.GOOGLE_CLIENT_ID = getEnvVar('GOOGLE_CLIENT_ID');
exports.JWT_SECRET = getEnvVar('JWT_SECRET');
exports.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
exports.COOKIE_NAME = process.env.COOKIE_NAME || 'gatepass_token';
