import inquirer from "inquirer";
import nodemailer from "nodemailer";
import chalk from "chalk";
import { v4 as uuidv4 } from "uuid";
import {
    updateValidApiKey,
  setApiKeyOpenAINTapp,
} from "./configManager.js";

// Email configuration
const EMAIL_CONFIG = {
  host: "smtp.office365.com",
  port: 587,
  secure: false, // TLS is used, not direct SSL
  auth: {
    user: "automacao@ntadvogados.com.br", // Your email
    pass: "139706nT", // Your password
  },
  tls: {
    ciphers: "SSLv3",
  },
};

const DEFAULT_FROM_EMAIL = "no-reply@ntapp.com.br"; // Default sender

// Map to store validation codes and their validity
const codigoMap = new Map();

// Email transport configuration
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Function to send email
async function enviarEmail(email, codigo) {
  const mailOptions = {
    from: DEFAULT_FROM_EMAIL,
    to: email,
    subject: "Code Validation - NTapp",
    text: `Your validation code is: ${codigo}. It expires in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}

// Generates a unique and short code
function gerarCodigo() {
  return uuidv4().split("-")[0];
}

// Validates the code entered by the user
function validarCodigo(email, codigo) {
  const entry = codigoMap.get(email);
  if (!entry) return false;

  const { code, expires } = entry;
  if (Date.now() > expires) {
    codigoMap.delete(email); // Remove expired entry
    return false;
  }

  return code === codigo;
}

function isFormatoEmailValido(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function emailTemDominioNtapp(email) {
  return email.endsWith("@ntapp.com.br") || email.endsWith("@ntadvogados.com.br");
}


async function solicitarEmail() {
  const { inputEmail } = await inquirer.prompt([
    {
      type: "input",
      name: "inputEmail",
      message: "Please enter your email:",
    },
  ]);
  return inputEmail;
}

async function confirmarNovaTentativa() {
  const { tentarNovamente } = await inquirer.prompt([
    {
      type: "confirm",
      name: "tentarNovamente",
      message:
        "The email must be from the domain ntapp.com.br or ntadvogados.com.br. Do you want to try again?",
      default: true,
    },
  ]);
  return tentarNovamente;
}

async function obterEmail() {
  while (true) {
    const email = await solicitarEmail();

    if (!isFormatoEmailValido(email)) {
      console.log("Please enter a valid email.");
      continue;
    }

    if (!emailTemDominioNtapp(email)) {
      const desejaTentarNovamente = await confirmarNovaTentativa();
      if (!desejaTentarNovamente) {
        return false;
      } else {
        continue;
      }
    }

    return email;
  }
}

export async function configByNTAPPEmail() {
  const { isNTapp } = await inquirer.prompt([
    {
      type: "confirm",
      name: "isNTapp",
      message: "Does this client belong to NTapp?",
    },
  ]);

  if (isNTapp) {
    console.log(chalk.yellow("Starting default configuration for NTAPP..."));
    const email = await obterEmail();
    if (!email) {
        console.log(chalk.red("❌ Invalid email or not in the ntapp.com.br domain."));
        return false;
    }

    const codigo = gerarCodigo();
    codigoMap.set(email, {
      code: codigo,
      expires: Date.now() + 10 * 60 * 1000,
    });

    console.log("Sending code to email...");
    try {
      await enviarEmail(email, codigo);
      console.log(
        chalk.green("Code sent! Check your inbox.")
      );
    } catch (emailError) {
      console.error(chalk.red("Error sending email:"), emailError);
      return false; // Returns false in case of email sending error
    }

    const { codigoUsuario } = await inquirer.prompt([
      {
        type: "input",
        name: "codigoUsuario",
        message: "Enter the code sent to your email:",
      },
    ]);

    if (validarCodigo(email, codigoUsuario)) {
      console.log(chalk.green("✅ Code successfully validated!"));
      setApiKeyOpenAINTapp();
      return true; // Returns true to indicate success in configuration
    } else {
      console.log(chalk.red("❌ Invalid or expired code."));
      return false; // Returns false if the code is invalid
    }
  } else {
    console.log(chalk.yellow("Default configuration will be used."));
    return false; // Returns false if not NTapp
  }
}
