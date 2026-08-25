from pathlib import Path
import tempfile
import unittest

from scripts.validate_guide import REQUIRED_PATHS, validate


class ValidateGuideTest(unittest.TestCase):

    def create_project(self, root: Path) -> Path:
        for relative_path in REQUIRED_PATHS:
            path = root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            if relative_path in ("CLAUDE.md", "GEMINI.md"):
                path.symlink_to("AGENTS.md")
            else:
                path.write_text("\n", encoding="utf-8")

        (root / "AGENTS.md").write_text(
            "Use ai-workflow. Read .guidekit/manifest.yaml and .guidekit/SOURCES.md.\n",
            encoding="utf-8",
        )
        (root / ".guidekit/manifest.yaml").write_text(
            "\n".join(
                (
                    "guide:",
                    "  id: navigation3",
                    "topic:",
                    "  kind: android_api",
                    "repository:",
                    "  name: Navigation3",
                    "scenarios:",
                    "  - id: basic",
                    "notion:",
                    "  data_source_name: POSTS",
                    "  existing_page_policy: update_in_place",
                    "validation:",
                    "  required:",
                    "    - :app:assembleDebug",
                )
            ),
            encoding="utf-8",
        )
        (root / ".guidekit/SOURCES.md").write_text(
            "https://developer.android.com/\n",
            encoding="utf-8",
        )
        (root / "README.md").write_text(
            "https://img.shields.io/github/last-commit/michaelbel/Navigation3\n",
            encoding="utf-8",
        )

        kotlin_path = root / "app/src/main/kotlin/org/michaelbel/navigation3/MainActivity.kt"
        kotlin_path.parent.mkdir(parents=True, exist_ok=True)
        kotlin_path.write_text(
            "\n".join(
                (
                    "package org.michaelbel.navigation3",
                    "",
                    "import androidx.activity.ComponentActivity",
                    "",
                    "class MainActivity: ComponentActivity()",
                )
            ),
            encoding="utf-8",
        )
        return kotlin_path

    def test_valid_project_has_no_errors(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            self.create_project(project)

            self.assertEqual([], validate(project))

    def test_wildcard_import_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            kotlin_path = self.create_project(project)
            kotlin_path.write_text(
                "\n".join(
                    (
                        "package org.michaelbel.navigation3",
                        "",
                        "import androidx.compose.runtime.*",
                    )
                ),
                encoding="utf-8",
            )

            errors = validate(project)

            self.assertTrue(any("Wildcard import" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
