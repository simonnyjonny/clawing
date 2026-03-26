# Contributing to OpenClaw AI Streaming Platform

First off, thank you for considering contributing to this project!

## Ways to Contribute

### Reporting Bugs
- Use GitHub Issues to report bugs
- Include details about your environment
- Provide steps to reproduce the issue

### Suggesting Features
- Open a GitHub Issue with the `enhancement` label
- Describe the feature you'd like to see
- Explain why this would be useful

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure nothing is broken
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/ai-streaming.git

# Install dependencies
cd ai-streaming/backend
npm install

cd ../frontend
npm install

# Run development servers
npm run start:dev  # backend
npm run dev         # frontend
```

## Code Style

- Use TypeScript
- Follow existing code formatting
- Run lint before committing: `npm run lint`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.