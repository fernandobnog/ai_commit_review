# AI Commit Report

A command-line tool powered by AI for creating or analyzing Git commits and code directly from your local Git repository.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
  - [Global Installation](#global-installation)
  - [Update](#update)
  - [Uninstallation](#uninstallation)
- [Getting Started](#getting-started)
  - [Set the API Key](#set-the-api-key)
  - [Set the OpenAI Model](#set-the-openai-model)
  - [Set the Response Language](#set-the-response-language)
  - [Configuração para IA local](#configuração-para-ia-local)
- [Usage](#usage)
  - [Analyze Commits](#analyze-commits)
  - [Create a Commit](#create-a-commit)
  - [Show Help](#show-help)
- [Examples](#examples)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
  - [How to Contribute](#how-to-contribute)
- [License](#license)
- [Notes and Suggestions](#notes-and-suggestions)
- [Additional Tips](#additional-tips)
- [Frequently Asked Questions (FAQs)](#frequently-asked-questions-faqs)

## Introduction

**AI Commit Report** is a robust tool that utilizes the OpenAI API to assist with creating commits and analyzing code changes in Git repositories. It delivers detailed insights into modifications, evaluates adherence to best practices, and offers suggestions for improving code quality. By enhancing development efficiency, this tool also supports AI-driven commit creation, simplifying and optimizing your Git workflow.

## Installation

### Global Installation

To install the tool globally on your system, use the following command:

```bash
npm install -g ai-commit-review
```

This method simplifies the installation, eliminating the need to clone the repository and manually install dependencies.

### Update

To update the tool to the latest version, use the command:

```bash
npm update -g ai-commit-review
```

This ensures that you are using the latest features and bug fixes available.

### Uninstallation

To uninstall the tool globally, use the command:

```bash
npm uninstall -g ai-commit-review
```

## Getting Started

Before using the tool, you must set your OpenAI API key, the desired model, and the response language.

1. If you belong to the NTAPP domain, simply run `acr` and follow the prompts to validate your email.  
2. Otherwise, set your OpenAI API key manually:

### Set the API Key

Use the `set_config` command:

```bash
acr set_config OPENAI_API_KEY=sk-your-key
```

### Set the OpenAI Model

Use the `set_config` command:

```bash
acr set_config OPENAI_API_MODEL=gpt-4o-mini
```

**Available Models:**

The tool currently integrates only with OpenAI’s ChatGPT models:

- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4`
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- `o1-preview`
- `o1-mini`

### Set the Response Language

Use the `set_config` command:

```bash
acr set_config OPENAI_RESPONSE_LANGUAGE=en-US
```

**Available Languages:**

- `EN_US`: English (US)
- `EN_GB`: English (UK)
- `ES`: Spanish
- `ZH`: Mandarin
- `HI`: Hindi
- `AR`: Arabic
- `FR`: French
- `RU`: Russian
- `PT_BR`: Portuguese (Brazil)
- `PT_PT`: Portuguese (Portugal)

### Configuração para IA local

Se você utiliza um servidor de IA local, a ferramenta pode configurar automaticamente as opções para uso local.  
Para configurar manualmente, execute os comandos:
  
```bash
acr set_config OPENAI_API_BASEURL=http://127.0.0.1:1234/v1
acr set_config OPENAI_API_MODEL=deepseek-r1-distill-llama-8b
acr set_config OPENAI_API_KEY=local
```

Isso define o endereço base da API local, utiliza o modelo de IA local e define a chave como "local".

## Usage

### Analyze Commits

To analyze commits, navigate to the repository directory and run:

```bash
acr analyze
```

The tool will list the last 5 commits and prompt you to select the commits to be analyzed. Follow the instructions displayed:

- **Controls:** Press `<space>` to select, `<a>` to toggle all, `<i>` to invert selection, and `<enter>` to proceed.

### Create a Commit

To create a new commit with AI assistance, use:

```bash
acr create
```

**Workflow:**

1. **Confirm or Switch Branch:** Ensures you are on the correct branch before making changes.
2. **Pull:** Pull the latest changes from the remote repository.
3. **Clear the Stage:** Clears the staging area to start fresh.
4. **Check for Conflicts:** Verifies there are no merge conflicts.
5. **Stage All Changes:** Stages all modified files.
6. **Generate Commit Message:**
   - **AI Assistance:** Generates a commit message based on the staged changes.
   - **Manual Entry:** Allows you to write your own commit message.
7. **Edit Commit Message:** Opens your default editor to finalize the commit message.
8. **Push to Remote:** Optionally pushes the commit to the remote repository.

### Show Help

To display help and view all available commands:

```bash
acr help
```

## Examples

- **Analyze Commits:**

  ```bash
  acr analyze
  ```

  Follow the instructions to select commits for analysis.

- **Create a New Commit with AI Assistance:**

  ```bash
  acr create
  ```

  Follow the interactive prompts to generate or write your commit message.

- **Set the OpenAI API Key:**

  ```bash
  acr set_config OPENAI_API_KEY=your-key
  ```

- **Set the OpenAI Model:**

  ```bash
  acr set_config OPENAI_API_MODEL=gpt-4o-mini
  ```

- **Set the Response Language:**

  ```bash
  acr set_config OPENAI_RESPONSE_LANGUAGE=en-US
  ```

- **Update AI Commit Report:**

  ```bash
  npm update -g ai-commit-review
  ```

  Updates the tool to the latest available version on npm.

## Dependencies

- **Node.js** (version 14 or higher)
- **npm**

## Contributing

Contributions are welcome! Feel free to open issues and pull requests in the repository.

### How to Contribute

1. **Fork the Project.**
2. **Create a New Branch:**

   ```bash
   git checkout -b my-feature
   ```

3. **Make Your Changes.**
4. **Commit Your Changes:**

   ```bash
   git commit -m 'My new feature'
   ```

5. **Push to the Remote Branch:**

   ```bash
   git push origin my-feature
   ```

6. **Open a Pull Request.**

   Navigate to your fork on GitHub and click the "Compare & pull request" button to submit your changes for review.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Notes and Suggestions

- **Focused Analysis:** The tool analyzes only the changes (diffs) made in the selected commits, making the process more efficient and targeted.
- **API Limitations:** Be mindful of OpenAI API token limits. Analyzing only diffs helps avoid exceeding these limits.
- **Sensitive Configurations:** Do not expose your API key in public or in files that will be committed.
- **Future Improvements:**
  - Implement unit tests to ensure code quality.
  - Add support for additional OpenAI models as they become available.
  - Enhance error handling and user messages.
- **Support:** If you encounter issues or have questions, open an issue on GitHub.

## Additional Tips

- **Efficiency:** Analyzing only the changes speeds up the process and reduces API resource consumption.
- **Focus on Changes:** The analysis is more precise when focused on recent changes, helping to identify potential issues introduced.
- **Security:** Ensure no sensitive information is included in diffs or logs.
- **Updates:** Keep your dependencies up-to-date to benefit from improvements and security fixes.

## Frequently Asked Questions (FAQs)

**Q:** _Can I use this tool with AI models other than OpenAI's ChatGPT?_  
**A:** Currently, the tool supports only OpenAI’s ChatGPT models. Support for additional models may be added in future updates.

---

**Q:** _What should I do if I encounter an error during installation?_  
**A:** Ensure you have the required dependencies installed and the appropriate permissions. Check error messages for specific details and consider opening an issue on GitHub if the problem persists.

**Q:** _How do I protect my API key when using this tool?_  
**A:** Never share your API key publicly. Use environment variables and avoid committing keys to the repository. Consider using secret management tools for added security.

**Q:** _What languages are available for analysis responses?_  
**A:** Responses can be configured in the following languages:

- **English (US)** - `en-US`
- **English (UK)** - `en-GB`
- **Spanish** - `es`
- **Mandarin** - `zh`
- **Hindi** - `hi`
- **Arabic** - `ar`
- **French** - `fr`
- **Russian** - `ru`
- **Portuguese (Brazil)** - `pt-BR`
- **Portuguese (Portugal)** - `pt-PT`
