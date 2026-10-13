// ECIES на WebCrypto: ECDH P-256 + AES-GCM.
// Отправитель шифрует публичным ключом, прочитать может только владелец приватного.
window.LoveCrypto = (() => {
  const ALG = { name: 'ECDH', namedCurve: 'P-256' };
  const AES = { name: 'AES-GCM', length: 256 };

  const b64 = buf => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  };
  const unb64 = str => {
    const s = atob(str);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  };

  const supported = () => !!(window.crypto && crypto.subtle && window.TextEncoder);

  async function encrypt(obj, pub) {
    const subtle = crypto.subtle;
    const recipient = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y, ext: true }, ALG, false, []);
    const eph = await subtle.generateKey(ALG, true, ['deriveKey']);
    const key = await subtle.deriveKey({ name: 'ECDH', public: recipient }, eph.privateKey, AES, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    const epub = await subtle.exportKey('raw', eph.publicKey);
    return JSON.stringify({ v: 1, e: b64(epub), i: b64(iv), c: b64(ct) });
  }

  async function importPrivate(pub, d) {
    return crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y, d, ext: true }, ALG, false, ['deriveKey']);
  }

  async function decrypt(str, privateKey) {
    const box = typeof str === 'string' ? JSON.parse(str) : str;
    if (box.v === 0) return box.p;
    const subtle = crypto.subtle;
    const eph = await subtle.importKey('raw', unb64(box.e), ALG, false, []);
    const key = await subtle.deriveKey({ name: 'ECDH', public: eph }, privateKey, AES, false, ['decrypt']);
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.i) }, key, unb64(box.c));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  return { supported, encrypt, decrypt, importPrivate };
})();
