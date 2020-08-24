import qrcode from 'qrcode';

class QrCode {
    generateQR = async (text: any) => {
        try {
            return await qrcode.toDataURL(text);
        } catch (err) {
            console.error(err);
        }
    };
}

export default new QrCode();
