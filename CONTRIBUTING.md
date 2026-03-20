# Contributing to End Times Monitor

Thank you for your interest in contributing to the **End Times Monitor** project! To maintain a clean, stable, and secure codebase, please read and follow these contribution guidelines.

## ⚠️ Important: Direct Pushes to `main` are Disabled

To ensure code quality and prevent accidental breaks in production, **direct pushes to the `main` branch are protected**. All changes must go through a **Pull Request (PR)** and require at least one approval before they can be merged.

### How to Contribute

1. **Fork the Repository**
   Create a personal fork of the project on GitHub.

2. **Clone your Fork locally**
   ```bash
   git clone https://github.com/YOUR_USERNAME/End-Times-Monitor.git
   cd End-Times-Monitor
   ```

3. **Create a Feature Branch**
   Always create a new branch for your work. Never work directly on `main` in your fork either.
   ```bash
   git checkout -b feature/your-amazing-feature
   # or
   git checkout -b fix/issue-description
   ```

4. **Make your Changes**
   - Ensure your code follows the existing style and architecture.
   - For backend/collector changes, refer to `docs/COLLECTOR_CONFIG_REFERENCE.md`.
   - Update documentation in the `docs/` folder if needed.

5. **Commit your Changes**
   Write clear, concise commit messages.
   ```bash
   git commit -m "feat: add new data source for XYZ"
   ```

6. **Push to your Fork**
   ```bash
   git push origin feature/your-amazing-feature
   ```

7. **Create a Pull Request**
   - Go to the original repository on GitHub.
   - Click "Compare & pull request".
   - Provide a clear description of what your PR does, why it is needed, and any potential side effects.
   - Wait for a maintainer to review and approve your PR.

## Documentation Reference
All main project documentation (architecture, setup, API keys, etc.) is located in the `docs/` folder. Please update it accordingly if your PR changes infrastructure or logic.

## Keeping the Repository Clean
If you use AI assistants, please do NOT commit temporary AI generation logs, checklists, or `.cursor` files. These should be placed in `docs/archive/` or entirely kept out of the Git tracking system.

*Thank you for helping us build End Times Monitor!*
