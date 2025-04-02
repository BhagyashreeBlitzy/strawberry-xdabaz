# Contributing to Node.js Hello World HTTP Server

Thank you for your interest in contributing to the Node.js Hello World HTTP Server project! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

Before you begin contributing, please ensure you have read the README.md file to understand the project's purpose, features, and requirements.

### Development Environment Setup

1. Fork the repository on GitHub
2. Clone your fork locally: `git clone https://github.com/YOUR-USERNAME/hello-world-server.git`
3. Navigate to the project directory: `cd hello-world-server`
4. Install dependencies: `cd src/backend && npm install`
5. Set up pre-commit hooks: `npm run prepare` (if available)

### Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bugfix-name`
2. Make your changes
3. Run tests to ensure your changes don't break existing functionality: `npm test`
4. Run linting to ensure code quality: `npm run lint`
5. Commit your changes with a descriptive commit message
6. Push your branch to your fork: `git push origin feature/your-feature-name`
7. Create a Pull Request from your fork to the main repository

## Coding Standards

Please follow these coding standards when contributing to the project:

### JavaScript Style Guide

This project uses ESLint to enforce a consistent coding style. The configuration is defined in `.eslintrc.js`. You can check your code against these standards by running:

```bash
npm run lint
```

To automatically fix some linting issues, run:

```bash
npm run lint:fix
```

### Code Documentation

- Use JSDoc comments for functions, classes, and methods
- Keep comments up-to-date when changing code
- Write clear, descriptive variable and function names
- Include comments for complex logic or non-obvious behavior

### Testing

All new features or bug fixes should include appropriate tests. This project uses Jest for testing.

- Write unit tests for new functions and methods
- Write integration tests for API endpoints
- Ensure all tests pass before submitting a Pull Request
- Aim for high test coverage of your code

Run tests with:

```bash
npm test
```

Check test coverage with:

```bash
npm run test:coverage
```

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation if necessary
3. Include tests for new features or bug fixes
4. Fill out the Pull Request template completely
5. Request a review from a project maintainer
6. Address any feedback or requested changes
7. Once approved, your Pull Request will be merged

### Pull Request Guidelines

- Keep Pull Requests focused on a single feature or bug fix
- Provide a clear description of the changes and their purpose
- Reference any related issues using the GitHub issue number (e.g., "Fixes #123")
- Ensure all CI checks pass
- Be responsive to feedback and questions

## Issue Reporting

If you find a bug or have a feature request, please create an issue using the appropriate template:

- For bugs: Use the Bug Report template
- For features: Use the Feature Request template

Before creating a new issue, please check if a similar issue already exists.

## Release Process

This project follows Semantic Versioning (SemVer). The release process is managed by the project maintainers.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.