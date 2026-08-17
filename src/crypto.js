import inquirer from "inquirer";
import crypto from 'crypto';

const algoritmo = 'aes-256-cbc';
let chave;

export function resetChave() {
    chave = null;
}

export function obterChave() {
    const password = process.env.PASSWORD_CRYPTO_KEY;
    if (!password) {
        throw new Error("PASSWORD_CRYPTO_KEY environment variable is not defined.");
    }
    if (!chave) {
        chave = crypto.scryptSync(password, 'sal', 32);
    }
    return chave;
}
const staticIv = Buffer.alloc(16, 0);

function criptografarsimples(texto) {
    const iv = crypto.randomBytes(16);
    const cifrador = crypto.createCipheriv(algoritmo, obterChave(), iv);
    let criptografado = cifrador.update(texto, 'utf8', 'hex');
    criptografado += cifrador.final('hex');
    return iv.toString('hex') + ':' + criptografado;
}

function decriptografarsimples(texto) {
    const partes = texto.split(':');
    let ivParaUso;
    let textoParaDecifrar;
    if (partes.length === 2) {
        ivParaUso = Buffer.from(partes[0], 'hex');
        textoParaDecifrar = partes[1];
    } else {
        ivParaUso = staticIv;
        textoParaDecifrar = texto;
    }
    const decifrador = crypto.createDecipheriv(algoritmo, obterChave(), ivParaUso);
    let decriptografado = decifrador.update(textoParaDecifrar, 'hex', 'utf8');
    decriptografado += decifrador.final('utf8');
    return decriptografado;
}

export function criptografar(texto) {
    let resultado = texto;
    for (let i = 0; i < 2; i++) {
        resultado = criptografarsimples(resultado);
    }
    return resultado;
}

export function decriptografar(texto) {
    let resultado = texto;
    for (let i = 0; i < 2; i++) {
        resultado = decriptografarsimples(resultado);
    }
    return resultado;
}

function handleCliAction(acao, texto) {
    if (acao === 'Encrypt') {
        const resultadoCripto = criptografar(texto);
        console.log('Encrypted text:', resultadoCripto);
        return resultadoCripto;
    }
    try {
        const resultadoDecripto = decriptografar(texto);
        console.log('Decrypted text:', resultadoDecripto);
        return resultadoDecripto;
    } catch (e) {
        console.error('Error decrypting. Verify that the text is correct and has been previously encrypted.');
        return null;
    }
}

export function criptografarcli(promptFn = inquirer.prompt) {
    return promptFn([
        {
            type: 'list',
            name: 'acao',
            message: 'What do you want to do?',
            choices: ['Encrypt', 'Decrypt']
        },
        {
            type: 'input',
            name: 'texto',
            message: 'Enter the text:'
        }
    ]).then(({ acao, texto }) => {
        return handleCliAction(acao, texto);
    }).catch(error => {
        console.error('An error occurred:', error);
        throw error;
    });
}