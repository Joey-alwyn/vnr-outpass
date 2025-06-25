import { customAlphabet } from 'nanoid';
import QRCode from 'qrcode';
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);
export async function generateQRCode(passId, token) {
    const scanUrl = `${process.env.PUBLIC_BASE_URL}/security/scan/${passId}/${token}`;
    return QRCode.toDataURL(scanUrl);
}
export function generateToken() {
    return nanoid();
}
