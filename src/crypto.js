import inquirer from "inquirer";
import crypto from 'crypto';

const algoritmo = 'aes-256-cbc';
let chave;

export function resetChave() {
    chave = null;
}

export function obterChave() {
    if (!chave) {
        const password = process.env.PASSWORD_CRYPTO_KEY || "default_secret_key";
        if (!password) {
            throw new Error("PASSWORD_CRYPTO_KEY environment variable is not defined.");
        }
        chave = crypto.scryptSync(password, 'sal', 32);
    }
    return chave;
}
const iv = Buffer.alloc(16, 0);

function criptografarsimples(texto) {
    const cifrador = crypto.createCipheriv(algoritmo, obterChave(), iv);
    let criptografado = cifrador.update(texto, 'utf8', 'hex');
    criptografado += cifrador.final('hex');
    return criptografado;
}

function decriptografarsimples(texto) {
    const decifrador = crypto.createDecipheriv(algoritmo, obterChave(), iv);
    let decriptografado = decifrador.update(texto, 'hex', 'utf8');
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
        if (acao === 'Encrypt') {
            const resultadoCripto = criptografar(texto);
            console.log('Encrypted text:', resultadoCripto);
            return resultadoCripto;
        } else if (acao === 'Decrypt') {
            try {
                const resultadoDecripto = decriptografar(texto);
                console.log('Decrypted text:', resultadoDecripto);
                return resultadoDecripto;
            } catch (e) {
                console.error('Error decrypting. Verify that the text is correct and has been previously encrypted.');
                return null;
            }
        }
    }).catch(error => {
        console.error('An error occurred:', error);
        throw error;
    });
}