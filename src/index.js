import {random, pki, cipher, util} from 'node-forge';

const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyfxU4QZbgbAHZv9atTIq
TPGsvaFezv3w2GxgtyronJQ0hhk+wKyIHKX1412+pxLGRkSinFmyxqEL7ob3iyqx
AvO4Spn74B6jcYxiqERX1igwOFduZNu1BcA9LLKU1P+QiZW2oovn1vyrdxrgJsTO
A5aukWZYIHOyO8H7Nuqp2t/UUQwn4FL9L+MLgn0zhAty7obJRN8YCkVA+AENM9+n
jGySiR+6PgPUmzMzbQyF58+yhsXytIidl8+Rkgmw7e2T6ZO0z0xrdoJltmS1T+bK
BMvsvrSxod6SY4QYeU0Cy+7CA5R8foggJVBcGPwHqelMYhjc32bZOsp1ZnrDlbmm
eQIDAQAB
-----END PUBLIC KEY-----`;

function encryptPlugin(source) {

  const KEY = random.getBytesSync(32);
  const IV = random.getBytesSync(16);

  const rsa = pki.publicKeyFromPem(publicKey);
  const ENC_KEY = rsa.encrypt(KEY);

  const cbc = cipher.createCipher('AES-CBC', KEY);
  cbc.start({iv: IV}); cbc.update(util.createBuffer(source)); cbc.finish();
  const data64 = util.encode64(cbc.output.getBytes());

  const key64 = util.encode64(util.createBuffer(ENC_KEY).getBytes());
  const iv64 = util.encode64(util.createBuffer(IV).getBytes());

  return `{"key":"${key64}","iv":"${iv64}","data":"${data64}"}`;

};

const dropzone = document.getElementById('dropzone');
dropzone.innerHTML = 'Drag and drop your plugin (.qplug, .lua) here...<br /><br />or click here to choose a file.';
dropzone.classList.add('animate__animated'); // animation
dropzone.classList.add('animate__faster'); // animation

const sourceFileInput = document.getElementById('sourceFile')

let plugin;
dropzone.addEventListener('click', () => {
  if(plugin) { // download converted plugin
    const file = new Blob([plugin.json], {type: 'application/octet-stream'});
    if (window.navigator.msSaveOrOpenBlob) window.navigator.msSaveOrOpenBlob(file, plugin.filename); // IE10+
    else { // Others
        var a = document.createElement("a"), url = URL.createObjectURL(file);
        a.href = url; a.download = plugin.filename;
        document.body.appendChild(a); a.click();
        setTimeout(function() { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0); 
    }
  } else { // upload new file
    sourceFileInput.click();
  }
});

function processFile(file) {
  const filenameParts = file.name.match(/(.*)\.([^.]+)/);
  if(!~['qplug','lua'].indexOf(filenameParts[2])) {
    dropzone.classList.add('animate__shakeX');
    dropzone.innerText = 'ERROR: Not a valid .qplug or .lua file.'; return;
  }
  
  // Start Encryption
  dropzone.innerText = `Encrypting ${file.name}...`; // show filename

  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function(e) {
    const decoder = new TextDecoder();
    const plainPlugin = decoder.decode(e.target.result);
    plugin = {
      json: encryptPlugin(plainPlugin),
      filename: `${filenameParts[1]}.qplugx`
    };
    dropzone.innerHTML = `
      <img src="download.svg" />
      Click to download ${plugin.filename}
    `;
  }
}

sourceFileInput.addEventListener('change', (e) => {
  processFile(sourceFileInput.files[0]);
});

['dragenter', 'dragleave', 'dragover', 'drop'].map(t => dropzone.addEventListener(t, (e) => {

  // Handle drop here
  e.stopPropagation();
  e.preventDefault();

  // Hover indication
  const over = ~['dragenter', 'dragover'].indexOf(e.type);
  dropzone.classList.remove('download');
  dropzone.classList[over?'add':'remove']('over');

  // Clear animation
  dropzone.classList.remove('animate__shakeX');

  // Handle drop
  if(e.type != 'drop') return;
  plugin = false; // clear previous encryption
  processFile(e.dataTransfer.files[0]);

}));

// Github
document.getElementById('github').addEventListener('click', () => { window.open('https://github.com/locimation/qpenc', '_blank'); })

// Copyright
document.getElementById('copyright').innerHTML = '&copy; ' + (new Date().getFullYear()) + ' Locimation Pty Ltd';