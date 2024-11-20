
# AI Commit Report

A command-line tool for analyzing Git commits and code, powered by AI from your local Git repository.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
  - [Global Installation](#global-installation)
- [Getting Started](#getting-started)
  - [Set the API Key](#set-the-api-key)
  - [Set the OpenAI Model](#set-the-openai-model)
  - [Set the Response Language](#set-the-response-language)
- [Usage](#usage)
  - [Analyze Commits](#analyze-commits)
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

**AI Commit Report** is a tool that uses the OpenAI API to analyze code changes in Git commits. It provides insights into the changes made, checks best practices, and suggests improvements to help maintain code quality and development efficiency.

## Installation

### Global Installation

To globally install the tool on your system, follow these steps:

1. **Fork the repository:**

   Navigate to the GitHub repository and click the "Fork" button to create your fork.

2. **Clone your fork:**

   ```bash
   git clone https://github.com/<your-username>/ai-commit-report.git
   ```

3. **Navigate to the project directory:**

   ```bash
   cd ai-commit-report
   ```

4. **Install dependencies:**

   ```bash
   npm install
   ```

5. **Install the package globally:**

   ```bash
   npm install -g .
   ```

   **Note:** If you encounter permission issues, you may need to adjust permissions or use `sudo`. It is recommended to configure your environment to avoid the need for `sudo` with npm.

## Getting Started

Before using the tool, you must set your OpenAI API key, the desired model, and the response language.

### Set the API Key

Use the `set_config` command:

```bash
acr set_config OPENAI_API_KEY=sk-your-key
```

### Set the OpenAI Model

Use the `set_config` command:

```bash
acr set_config OPENAI_API_MODEL=gpt-4
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

## Usage

### Analyze Commits

To analyze commits, navigate to the repository directory and run:

```bash
acr
```

The tool will list the last 15 commits and prompt you to select the commits to be analyzed. Follow the instructions displayed:

- **Controls:** Press `<space>` to select, `<a>` to toggle all, `<i>` to invert selection, and `<enter>` to proceed.

### Show Help

To display help and view all available commands:

```bash
acr help
```

## Examples

- **Analyze specific commits:**

  ```bash
  acr
  ```

  Follow the instructions to select commits for analysis.

- **Set the OpenAI API key:**

  ```bash
  acr set_config OPENAI_API_KEY=your-key
  ```

- **Set the OpenAI model:**

  ```bash
  acr set_config OPENAI_API_MODEL=gpt-4o-mini
  ```

- **Set the response language:**

  ```bash
  acr set_config OPENAI_RESPONSE_LANGUAGE=en-US
  ```

## Dependencies

- **Node.js** (version 14 or higher)
- **npm**

## Contributing

Contributions are welcome! Feel free to open issues and pull requests in the repository.

### How to Contribute

1. **Fork the project.**
2. **Create a new branch:**

   ```bash
   git checkout -b my-feature
   ```

3. **Make your changes.**
4. **Commit your changes:**

   ```bash
   git commit -m 'My new feature'
   ```

5. **Push to the remote branch:**

   ```bash
   git push origin my-feature
   ```

6. **Open a pull request.**

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

---
