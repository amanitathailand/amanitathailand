/**
 * PromptPay QR Code Generator (EMVCo Standard)
 * Supports Mobile Numbers (10 digits), National ID (13 digits), and e-Wallet (15 digits)
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  const cleanTarget = target.replace(/[^0-9]/g, '');
  let targetField = '';

  if (cleanTarget.length === 10) {
    // Mobile number: prefix with 0066 and drop first 0
    const formattedPhone = '0066' + cleanTarget.substring(1);
    targetField = formatField('01', formattedPhone);
  } else if (cleanTarget.length === 13) {
    // National ID
    targetField = formatField('02', cleanTarget);
  } else if (cleanTarget.length === 15) {
    // e-Wallet ID
    targetField = formatField('03', cleanTarget);
  } else {
    // Fallback formatted phone
    targetField = formatField('01', '0066' + cleanTarget);
  }

  // Merchant Account Info - PromptPay AID: A000000677010111
  const aidField = formatField('00', 'A000000677010111');
  const merchantInfo = formatField('29', `${aidField}${targetField}`);

  // Base EMVCo tags
  let payload = '';
  payload += formatField('00', '01'); // Payload Format Indicator
  payload += formatField('01', amount && amount > 0 ? '12' : '11'); // Point of Initiation: 12 = Dynamic (with amount), 11 = Static
  payload += merchantInfo;
  payload += formatField('53', '764'); // Currency THB (764)

  if (amount !== undefined && amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  payload += formatField('58', 'TH'); // Country TH

  // Checksum tag 63 length 04
  const payloadWithTag63 = `${payload}6304`;
  const checksum = crc16(payloadWithTag63);

  return `${payloadWithTag63}${checksum}`;
}

export function getPromptPayQrImageUrl(target: string, amount?: number): string {
  try {
    const cleanTarget = (target || '0909964514').replace(/[^0-9]/g, '');
    const validAmount = amount && amount > 0 ? amount : 0;
    
    // Generate official EMVCo PromptPay payload
    const payload = generatePromptPayPayload(cleanTarget, validAmount);
    
    // Use QR Server API to render the standard EMVCo PromptPay payload
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(payload)}`;
  } catch (err) {
    // Fallback to promptpay.io direct image endpoint
    const cleanTarget = (target || '0909964514').replace(/[^0-9]/g, '');
    return amount && amount > 0 
      ? `https://promptpay.io/${cleanTarget}/${amount}.png`
      : `https://promptpay.io/${cleanTarget}.png`;
  }
}
