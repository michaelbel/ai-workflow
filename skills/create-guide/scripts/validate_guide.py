#!/usr/bin/env python3

import argparse
from pathlib import Path
import re
import subprocess
import sys


REQUIRED_PATHS = (
    ".github/CODEOWNERS",
    ".github/FUNDING.yml",
    ".github/workflows/ci.yml",
    ".guidekit/manifest.yaml",
    ".guidekit/research.md",
    ".guidekit/implementation-plan.md",
    ".guidekit/SOURCES.md",
    ".guidekit/validation-report.md",
    ".idea/icon.svg",
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    "README.md",
    "app/build.gradle.kts",
    "build.gradle.kts",
    "gradle/libs.versions.toml",
    "gradlew",
    "settings.gradle.kts",
)

WILDCARD_IMPORT = re.compile(r"^import\s+[\w.]+\.\*$", re.MULTILINE)
PACKAGE_DECLARATION = re.compile(r"^package\s+([\w.]+)", re.MULTILINE)
SAMPLE_DIRECTORY = re.compile(r"sample\d{2}_[A-Za-z0-9_]+$")


def instruction_link_error(path: Path) -> str | None:
    if path.is_symlink():
        if path.readlink() != Path("AGENTS.md"):
            return f"{path.name} must point to AGENTS.md"
        return None

    if path.is_file() and path.read_text(encoding="utf-8").strip() == "AGENTS.md":
        return None

    return f"{path.name} must be a symlink to AGENTS.md"


def run_command(project: Path, command: list[str]) -> tuple[bool, str]:
    result = subprocess.run(
        command,
        cwd=project,
        check=False,
        text=True,
    )
    return result.returncode == 0, " ".join(command)


def validate(project: Path) -> list[str]:
    errors: list[str] = []

    for relative_path in REQUIRED_PATHS:
        path = project / relative_path
        if not path.exists() and not path.is_symlink():
            errors.append(f"Missing required path: {relative_path}")

    for name in ("CLAUDE.md", "GEMINI.md"):
        error = instruction_link_error(project / name)
        if error:
            errors.append(error)

    agents_path = project / "AGENTS.md"
    if agents_path.exists():
        agents = agents_path.read_text(encoding="utf-8")
        for phrase in ("cuckcoder", ".guidekit/manifest.yaml", ".guidekit/SOURCES.md"):
            if phrase not in agents:
                errors.append(f"AGENTS.md does not mention: {phrase}")

    manifest_path = project / ".guidekit/manifest.yaml"
    if manifest_path.exists():
        manifest = manifest_path.read_text(encoding="utf-8")
        for section in ("guide:", "topic:", "repository:", "scenarios:", "notion:", "validation:"):
            if section not in manifest:
                errors.append(f"Manifest misses section: {section}")
        if re.search(r"<[^>\n]+>", manifest):
            errors.append("Manifest still contains template placeholders")

    source_root = project / "app/src"
    kotlin_files = tuple(source_root.rglob("*.kt")) if source_root.exists() else ()
    if not kotlin_files:
        errors.append("No Kotlin source files found under app/src")

    for kotlin_file in kotlin_files:
        content = kotlin_file.read_text(encoding="utf-8")
        relative_path = kotlin_file.relative_to(project)
        if WILDCARD_IMPORT.search(content):
            errors.append(f"Wildcard import in {relative_path}")
        package_match = PACKAGE_DECLARATION.search(content)
        if package_match and not package_match.group(1).startswith("org.michaelbel."):
            errors.append(f"Unexpected package in {relative_path}: {package_match.group(1)}")

    sample_directories = {
        path
        for kotlin_file in kotlin_files
        for path in kotlin_file.parents
        if path != source_root and SAMPLE_DIRECTORY.fullmatch(path.name)
    }
    readme_path = project / "README.md"
    if readme_path.exists():
        readme = readme_path.read_text(encoding="utf-8")
        if "shields.io/github/last-commit/" not in readme:
            errors.append("README misses the last-commit badge")
        if len(sample_directories) > 1 and "## Samples" not in readme:
            errors.append("Catalog project README misses the Samples section")

    sources_path = project / ".guidekit/SOURCES.md"
    if sources_path.exists():
        sources = sources_path.read_text(encoding="utf-8")
        if "https://" not in sources:
            errors.append("SOURCES.md does not contain any source URL")
        if re.search(r"<[^>\n]+>", sources):
            errors.append("SOURCES.md still contains template placeholders")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an Android guide repository")
    parser.add_argument("project", type=Path)
    parser.add_argument("--run-gradle", action="store_true")
    args = parser.parse_args()

    project = args.project.resolve()
    if not project.is_dir():
        print(f"ERROR: Project directory does not exist: {project}")
        return 1

    errors = validate(project)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    if args.run_gradle:
        gradlew = project / "gradlew"
        commands = (
            [str(gradlew), ":app:assembleDebug"],
            [str(gradlew), ":app:lintDebug"],
        )
        for command in commands:
            passed, rendered = run_command(project, command)
            if not passed:
                print(f"ERROR: Gradle command failed: {rendered}")
                return 1

        unit_test_sources = tuple((project / "app/src/test").rglob("*.kt"))
        if unit_test_sources:
            passed, rendered = run_command(project, [str(gradlew), ":app:testDebugUnitTest"])
            if not passed:
                print(f"ERROR: Gradle command failed: {rendered}")
                return 1

    print(f"Guide repository is valid: {project}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
