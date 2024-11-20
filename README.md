# AI Commit Report

Command-line tool for AI-powered commit and code analysis from the local Git repository.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
  - [Global Installation](#global-installation)
- [Getting Started](#getting-started)
  - [Set the API Key](#set-the-api-key)
  - [Set the OpenAI Model](#set-the-openai-model)
- [Usage](#usage)
  - [Analyze a Commit](#analyze-a-commit)
  - [Display Help](#display-help)
- [Examples](#examples)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
  - [How to Contribute](#how-to-contribute)
- [License](#license)
- [Notes and Suggestions](#notes-and-suggestions)
- [Additional Tips](#additional-tips)
- [FAQs](#faqs)

## Introduction

The **AI Commit Report** is a tool that uses the OpenAI API to analyze code changes in Git commits. It provides insights about the changes made, checks for best practices, and suggests improvements.

## Installation

### Global Installation

To install the tool globally on your system:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/ai-commit-report.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd ai-commit-report
   ```

3. **Install the dependencies:**

   ```bash
   npm install
   ```

4. **Install the package globally:**

   ```bash
   npm install -g .
   ```

   **Note:** You may need to adjust permissions or use `sudo` if you encounter permission errors. It's recommended to configure your environment to avoid using `sudo` with npm.

## Getting Started

Before using the tool, you need to configure your OpenAI API key and the model to be used.

### Set the API Key

1. **Using the `set_config` command:**

   ```bash
   gcr set_config OPENAI_API_KEY=sk-your-key
   ```

### Set the OpenAI Model

1. **Using the `set_config` command:**

   ```bash
   gcr set_config OPENAI_API_MODEL=gpt-4
   ```

**Available Models:**

Currently, integration is only with OpenAI's ChatGPT.

- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4`
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- `o1-preview`
- `o1-mini`

## Usage

The tool offers a basic command to facilitate the analysis of commits.

### Analyze a Commit

To analyze the changes in a specific commit:

```bash
gcr <COMMIT_SHA>
```

Replace `<COMMIT_SHA>` with the SHA of the commit you want to analyze.

### Display Help

To display help and see all available commands:

```bash
gcr help
```

## Examples

- **Analyze a specific commit:**

  ```bash
  gcr 123abc
  ```

- **Set the OpenAI API key:**

  ```bash
  gcr set_config OPENAI_API_KEY=your-key
  ```

- **Set the OpenAI model:**

  ```bash
  gcr set_config OPENAI_API_MODEL=gpt-4o-mini
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

3. **Make your modifications.**
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

This project is licensed under the MIT License.

## Notes and Suggestions

- **Focused Analysis on Changes:** The tool now analyzes only the changes (diffs) made in commits, making the analysis more efficient and focused.

- **API Limitations:** Be mindful of the token limits of the OpenAI API. Analyzing only diffs helps avoid hitting these limits.

- **Sensitive Configurations:** Do not expose your API key in public places or in files that will be committed.

- **Future Improvements:**

  - Implement unit tests to ensure code quality.
  - Add support for other OpenAI models as they become available.
  - Improve error handling and user messages.

- **Support:** If you encounter problems or have questions, open an issue on GitHub.

## Additional Tips

- **Efficiency:** Analyzing only the changes makes the process faster and consumes fewer API resources.

- **Focus on Changes:** The analysis is more accurate when focused on recent changes, making it easier to identify potential issues introduced.

- **Security:** Ensure that sensitive information is not included in diffs or logs.

- **Updates:** Keep your dependencies up to date to benefit from improvements and security fixes.

## FAQs

**Q:** _Can I use this tool with other AI models besides OpenAI's ChatGPT?_

**A:** Currently, the tool only supports integration with OpenAI's ChatGPT models. Support for additional models may be added in future updates.

**Q:** _What should I do if I encounter an error during installation?_

**A:** Ensure that you have the required dependencies installed and that you have the necessary permissions. Check the error messages for specific details, and consider opening an issue on GitHub if the problem persists.

---
