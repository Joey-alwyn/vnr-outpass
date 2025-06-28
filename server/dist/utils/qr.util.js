"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = generateQRCode;
exports.generateToken = generateToken;
const nanoid_1 = require("nanoid");
const qrcode_1 = __importDefault(require("qrcode"));
const nanoid = (0, nanoid_1.customAlphabet)('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);
async function generateQRCode(passId, token) {
    const scanUrl = `${process.env.PUBLIC_BASE_URL}/security/scan/${passId}/${token}`;
    return qrcode_1.default.toDataURL(scanUrl);
}
function generateToken() {
    return nanoid();
}
