import inquirer from "inquirer";
import crypto from 'crypto';

const algoritmo = 'aes-256-cbc';
const chave = crypto.scryptSync('YwySEh4l70R09C4ps9rIzJQ13wocBeX21vjbaNQ2GO2cMLVfPgsWR7TFzB4YNBYSC3kMoLHdUFiQZTWzGkFT9P5dPxWQThzZb2NMjxKC5iB5037064dlkouo2fWLP0L7', 'sal', 32);
const iv = Buffer.alloc(16, 0);

function criptografarsimples(texto) {
    const cifrador = crypto.createCipheriv(algoritmo, chave, iv);
    let criptografado = cifrador.update(texto, 'utf8', 'hex');
    criptografado += cifrador.final('hex');
    return criptografado;
}

function decriptografarsimples(texto) {
    const decifrador = crypto.createDecipheriv(algoritmo, chave, iv);
    let decriptografado = decifrador.update(texto, 'hex', 'utf8');
    decriptografado += decifrador.final('utf8');
    return decriptografado;
}

function criptografar(texto) {
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

export function criptografarcli() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'acao',
            message: 'O que deseja fazer?',
            choices: ['Criptografar', 'Decriptografar']
        },
        {
            type: 'input',
            name: 'texto',
            message: 'Digite o texto:'
        }
    ]).then(({ acao, texto }) => {
        if (acao === 'Criptografar') {
            const resultadoCripto = criptografar(texto);
            console.log('Texto criptografado:', resultadoCripto);
        } else if (acao === 'Decriptografar') {
            try {
                const resultadoDecripto = decriptografar(texto);
                console.log('Texto decriptografado:', resultadoDecripto);
            } catch (e) {
                console.error('Erro ao decriptografar. Verifique se o texto está correto e foi criptografado previamente.');
            }
        }
    }).catch(error => {
        console.error('Ocorreu um erro:', error);
    });
    
}