// Mocked JWTs: structurally valid, decodable by any JWT client, and carrying
// realistic claims -- but the signature is a deterministic stand-in, not a real
// HMAC. Hand-rolled rather than pulling in a JWT library so this package stays
// dependency-free and keeps bundling for the browser (see doggoganger/src/browser.js),
// where node:crypto is unavailable.

const HEADER = { alg: 'HS256', typ: 'JWT' };

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function mockJwt(claims) {
  const signingInput = `${encodeJson(HEADER)}.${encodeJson(claims)}`;
  return `${signingInput}.${mockSignature(signingInput)}`;
}

// The claims of a token, or undefined if it does not read as a JWT. Lenient by
// design: the signature is not checked (see mockSignature), and a foreign or
// opaque token simply has no claims to offer.
export function decodeJwt(token) {
  const segments = typeof token === 'string' ? token.split('.') : [];
  if (segments.length !== 3) {
    return undefined;
  }
  try {
    const claims = JSON.parse(new TextDecoder().decode(fromBase64url(segments[1])));
    return claims && typeof claims === 'object' ? claims : undefined;
  } catch (_) {
    return undefined;
  }
}

function encodeJson(value) {
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

// Unpadded base64url, as JWT requires
function base64url(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [b0, b1, b2] = [bytes[i], bytes[i + 1], bytes[i + 2]];
    out += B64URL[b0 >> 2];
    out += B64URL[((b0 & 3) << 4) | ((b1 || 0) >> 4)];
    if (b1 === undefined) {
      break;
    }
    out += B64URL[((b1 & 15) << 2) | ((b2 || 0) >> 6)];
    if (b2 === undefined) {
      break;
    }
    out += B64URL[b2 & 63];
  }
  return out;
}

function fromBase64url(str) {
  const bytes = [];
  let buffer = 0, bits = 0;
  for (const char of str) {
    const value = B64URL.indexOf(char);
    if (value < 0) {
      throw new Error(`Invalid base64url character: ${char}`);
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

// 32 bytes derived from the signing input, so the same token always renders the
// same signature and different tokens differ -- the shape of a real HS256
// signature without the cryptography. NOT secure: never verify against this.
function mockSignature(signingInput) {
  let h = 0x811c9dc5;
  for (let i = 0; i < signingInput.length; i++) {
    h = Math.imul(h ^ signingInput.charCodeAt(i), 0x01000193) >>> 0;
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) {
    h = Math.imul(h ^ (h >>> 15) ^ i, 0x01000193) >>> 0;
    bytes[i] = (h >>> 24) & 0xff;
  }
  return base64url(bytes);
}
